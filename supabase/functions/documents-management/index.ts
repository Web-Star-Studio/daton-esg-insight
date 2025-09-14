import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const authHeader = req.headers.get('Authorization')!
    supabaseClient.auth.setSession({ access_token: authHeader.replace('Bearer ', ''), refresh_token: '' })

    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) {
      return new Response('Unauthorized', { status: 401, headers: corsHeaders })
    }

    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return new Response('Profile not found', { status: 404, headers: corsHeaders })
    }

    const company_id = profile.company_id
    const url = new URL(req.url)
    const path = url.pathname

    const routeMatch = path.match(/^\/documents-management\/(\w+)/)
    const route = routeMatch ? routeMatch[1] : 'documents'

    switch (route) {
      case 'folders':
        if (req.method === 'GET') {
          return await getFolders(supabaseClient, company_id)
        } else if (req.method === 'POST') {
          const body = await req.json()
          return await createFolder(supabaseClient, company_id, body)
        }
        break

      case 'upload':
        if (req.method === 'POST') {
          return await uploadDocument(supabaseClient, company_id, user.id, req)
        }
        break

      case 'download':
        if (req.method === 'GET') {
          const documentId = url.searchParams.get('id')
          if (documentId) {
            return await downloadDocument(supabaseClient, company_id, documentId)
          }
        }
        break

      case 'documents':
      default:
        if (req.method === 'GET') {
          return await getDocuments(supabaseClient, company_id, url.searchParams)
        } else if (req.method === 'PUT') {
          const documentId = url.searchParams.get('id')
          const body = await req.json()
          if (documentId) {
            return await updateDocument(supabaseClient, company_id, documentId, body)
          }
        } else if (req.method === 'DELETE') {
          const documentId = url.searchParams.get('id')
          if (documentId) {
            return await deleteDocument(supabaseClient, company_id, documentId)
          }
        }
        break
    }

    return new Response('Not found', { status: 404, headers: corsHeaders })

  } catch (error) {
    console.error('Error in documents-management function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

async function getFolders(supabase: any, company_id: string) {
  const { data, error } = await supabase
    .from('document_folders')
    .select('*')
    .eq('company_id', company_id)
    .order('name')

  if (error) {
    throw new Error(`Failed to fetch folders: ${error.message}`)
  }

  const folderTree = buildFolderTree(data || [])

  return new Response(
    JSON.stringify(folderTree),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function createFolder(supabase: any, company_id: string, folderData: any) {
  const { data, error } = await supabase
    .from('document_folders')
    .insert({
      name: folderData.name,
      parent_folder_id: folderData.parent_folder_id || null,
      company_id
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create folder: ${error.message}`)
  }

  return new Response(
    JSON.stringify(data),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function getDocuments(supabase: any, company_id: string, searchParams: URLSearchParams) {
  let query = supabase
    .from('documents')
    .select(`
      *,
      folder:document_folders(id, name),
      uploader:profiles!documents_uploader_user_id_fkey(id, full_name)
    `)
    .eq('company_id', company_id)
    .order('upload_date', { ascending: false })

  const search = searchParams.get('search')
  if (search) {
    query = query.or(`file_name.ilike.%${search}%,tags.cs.{${search}}`)
  }

  const folderId = searchParams.get('folder_id')
  if (folderId) {
    query = query.eq('folder_id', folderId)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(`Failed to fetch documents: ${error.message}`)
  }

  return new Response(
    JSON.stringify(data),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function uploadDocument(supabase: any, company_id: string, user_id: string, req: Request) {
  const formData = await req.formData()
  const file = formData.get('file') as File
  const folderId = formData.get('folder_id') as string || null
  const tags = formData.get('tags') as string || ''
  const relatedModel = formData.get('related_model') as string || 'general'
  const relatedId = formData.get('related_id') as string || crypto.randomUUID()

  if (!file) {
    return new Response(
      JSON.stringify({ error: 'No file provided' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const fileName = `${crypto.randomUUID()}_${file.name}`
  const filePath = `${company_id}/${fileName}`

  try {
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documents')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      throw new Error(`Failed to upload file: ${uploadError.message}`)
    }

    const { data: document, error: documentError } = await supabase
      .from('documents')
      .insert({
        file_name: file.name,
        file_path: uploadData.path,
        file_type: file.type,
        file_size: file.size,
        folder_id: folderId,
        tags: tags ? tags.split(',').map((tag: string) => tag.trim()) : [],
        related_model: relatedModel,
        related_id: relatedId,
        company_id,
        uploader_user_id: user_id
      })
      .select()
      .single()

    if (documentError) {
      await supabase.storage.from('documents').remove([uploadData.path])
      throw new Error(`Failed to save document metadata: ${documentError.message}`)
    }

    return new Response(
      JSON.stringify(document),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Upload error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
}

async function updateDocument(supabase: any, company_id: string, document_id: string, updateData: any) {
  const { data, error } = await supabase
    .from('documents')
    .update({
      folder_id: updateData.folder_id,
      tags: updateData.tags
    })
    .eq('id', document_id)
    .eq('company_id', company_id)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to update document: ${error.message}`)
  }

  return new Response(
    JSON.stringify(data),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function deleteDocument(supabase: any, company_id: string, document_id: string) {
  const { data: document, error: fetchError } = await supabase
    .from('documents')
    .select('file_path')
    .eq('id', document_id)
    .eq('company_id', company_id)
    .single()

  if (fetchError) {
    throw new Error(`Failed to fetch document: ${fetchError.message}`)
  }

  const { error: storageError } = await supabase.storage
    .from('documents')
    .remove([document.file_path])

  if (storageError) {
    console.error('Failed to delete file from storage:', storageError)
  }

  const { error: deleteError } = await supabase
    .from('documents')
    .delete()
    .eq('id', document_id)
    .eq('company_id', company_id)

  if (deleteError) {
    throw new Error(`Failed to delete document: ${deleteError.message}`)
  }

  return new Response(
    JSON.stringify({ success: true }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function downloadDocument(supabase: any, company_id: string, document_id: string) {
  const { data: document, error: fetchError } = await supabase
    .from('documents')
    .select('file_path, file_name')
    .eq('id', document_id)
    .eq('company_id', company_id)
    .single()

  if (fetchError) {
    throw new Error(`Failed to fetch document: ${fetchError.message}`)
  }

  const { data: signedUrl, error: urlError } = await supabase.storage
    .from('documents')
    .createSignedUrl(document.file_path, 60)

  if (urlError) {
    throw new Error(`Failed to generate download URL: ${urlError.message}`)
  }

  return new Response(
    JSON.stringify({
      download_url: signedUrl.signedUrl,
      file_name: document.file_name
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

function buildFolderTree(folders: any[]): any[] {
  const folderMap = new Map()
  const rootFolders = []

  for (const folder of folders) {
    folderMap.set(folder.id, { ...folder, children: [] })
  }

  for (const folder of folders) {
    const folderWithChildren = folderMap.get(folder.id)
    
    if (folder.parent_folder_id) {
      const parent = folderMap.get(folder.parent_folder_id)
      if (parent) {
        parent.children.push(folderWithChildren)
      } else {
        rootFolders.push(folderWithChildren)
      }
    } else {
      rootFolders.push(folderWithChildren)
    }
  }

  return rootFolders
}