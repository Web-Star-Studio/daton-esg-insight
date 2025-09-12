import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Get auth header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    // Get user from auth header
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (authError || !user) {
      throw new Error('Invalid authentication')
    }

    // Get user company_id from profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single()

    if (profileError || !profile?.company_id) {
      throw new Error('User company not found')
    }

    const userCompanyId = profile.company_id

    const url = new URL(req.url)
    const path = url.pathname.split('/').pop()
    const method = req.method

    console.log(`Documents API: ${method} ${path}`)

    // Route handling
    switch (`${method}:${path}`) {
      case 'GET:folders': {
        // Get folder hierarchy
        const { data: folders, error } = await supabase
          .from('document_folders')
          .select('*')
          .order('name')

        if (error) throw error

        // Build hierarchy
        const folderMap = new Map()
        const rootFolders: any[] = []

        folders?.forEach(folder => {
          folderMap.set(folder.id, { ...folder, children: [] })
        })

        folders?.forEach(folder => {
          if (folder.parent_folder_id) {
            const parent = folderMap.get(folder.parent_folder_id)
            if (parent) {
              parent.children.push(folderMap.get(folder.id))
            }
          } else {
            rootFolders.push(folderMap.get(folder.id))
          }
        })

        return new Response(JSON.stringify(rootFolders), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      case 'POST:folders': {
        const body = await req.json()
        const { name, parent_folder_id } = body

        const { data: folder, error } = await supabase
          .from('document_folders')
          .insert({
            name,
            parent_folder_id,
            company_id: userCompanyId
          })
          .select()
          .single()

        if (error) throw error

        return new Response(JSON.stringify(folder), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      case 'GET:documents': {
        const search = url.searchParams.get('search')
        const folderId = url.searchParams.get('folder_id')
        const tag = url.searchParams.get('tag')

        let query = supabase
          .from('documents')
          .select(`
            *,
            document_folders(name)
          `)
          .order('upload_date', { ascending: false })

        if (search) {
          query = query.or(`file_name.ilike.%${search}%,tags.cs.{${search}}`)
        }

        if (folderId) {
          query = query.eq('folder_id', folderId)
        } else if (folderId === null) {
          query = query.is('folder_id', null)
        }

        if (tag) {
          query = query.contains('tags', [tag])
        }

        const { data: documents, error } = await query

        if (error) throw error

        return new Response(JSON.stringify(documents), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      case 'POST:upload': {
        const formData = await req.formData()
        const file = formData.get('file') as File
        const folderId = formData.get('folder_id') as string
        const tags = formData.get('tags') as string
        const relatedModel = formData.get('related_model') as string || 'document'
        const relatedId = formData.get('related_id') as string

        if (!file) {
          throw new Error('No file provided')
        }

        // Upload to storage
        const fileName = `${Date.now()}_${file.name}`
        const filePath = `documents/${fileName}`
        
        const { error: uploadError } = await supabase.storage
          .from('documents')
          .upload(filePath, file)

        if (uploadError) throw uploadError

        // Save document record
        const { data: document, error: dbError } = await supabase
          .from('documents')
          .insert({
            file_name: file.name,
            file_path: filePath,
            file_type: file.type,
            file_size: file.size,
            folder_id: folderId || null,
            tags: tags ? tags.split(',').map(t => t.trim()) : [],
            related_model: relatedModel,
            related_id: relatedId || crypto.randomUUID(),
            company_id: userCompanyId,
            uploader_user_id: user.id
          })
          .select()
          .single()

        if (dbError) throw dbError

        return new Response(JSON.stringify(document), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      case 'PUT:documents': {
        const documentId = url.searchParams.get('id')
        const body = await req.json()
        const { folder_id, tags } = body

        const { data: document, error } = await supabase
          .from('documents')
          .update({
            folder_id,
            tags
          })
          .eq('id', documentId)
          .select()
          .single()

        if (error) throw error

        return new Response(JSON.stringify(document), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      case 'DELETE:documents': {
        const documentId = url.searchParams.get('id')

        // Get document to delete file from storage
        const { data: document } = await supabase
          .from('documents')
          .select('file_path')
          .eq('id', documentId)
          .single()

        if (document?.file_path) {
          await supabase.storage
            .from('documents')
            .remove([document.file_path])
        }

        // Delete document record
        const { error } = await supabase
          .from('documents')
          .delete()
          .eq('id', documentId)

        if (error) throw error

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      case 'GET:download': {
        const documentId = url.searchParams.get('id')

        const { data: document } = await supabase
          .from('documents')
          .select('file_path, file_name')
          .eq('id', documentId)
          .single()

        if (!document) {
          throw new Error('Document not found')
        }

        const { data: signedUrl } = await supabase.storage
          .from('documents')
          .createSignedUrl(document.file_path, 3600) // 1 hour

        return new Response(JSON.stringify({ 
          url: signedUrl?.signedUrl,
          fileName: document.file_name 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      default:
        return new Response('Not Found', { 
          status: 404, 
          headers: corsHeaders 
        })
    }

  } catch (error) {
    console.error('Documents API Error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})