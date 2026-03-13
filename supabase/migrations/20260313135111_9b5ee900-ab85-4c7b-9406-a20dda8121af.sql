
-- Desvincular cargo cross-company que referencia departamento a ser deletado
UPDATE positions SET department_id = NULL WHERE id = 'd7e45a5f-11d5-413f-95e5-a644fabab659';

-- Desvincular quaisquer outros cargos que referenciam departamentos dessas empresas
UPDATE positions SET department_id = NULL 
WHERE department_id IN (
  SELECT id FROM departments WHERE company_id IN ('021647af-61a5-4075-9db3-bb5024ef7a67', '5207e9eb-3ac3-462d-aede-07000792d4f5')
);

-- Deletar departamentos existentes
DELETE FROM departments 
WHERE company_id IN ('021647af-61a5-4075-9db3-bb5024ef7a67', '5207e9eb-3ac3-462d-aede-07000792d4f5');

-- Inserir 27 departamentos para Gabardo
INSERT INTO departments (company_id, name) VALUES
('021647af-61a5-4075-9db3-bb5024ef7a67', 'Abastecimento'),
('021647af-61a5-4075-9db3-bb5024ef7a67', 'Administrativo'),
('021647af-61a5-4075-9db3-bb5024ef7a67', 'Almoxarifado'),
('021647af-61a5-4075-9db3-bb5024ef7a67', 'Borracharia'),
('021647af-61a5-4075-9db3-bb5024ef7a67', 'Carregamento'),
('021647af-61a5-4075-9db3-bb5024ef7a67', 'Comercial'),
('021647af-61a5-4075-9db3-bb5024ef7a67', 'Compras'),
('021647af-61a5-4075-9db3-bb5024ef7a67', 'Diretoria'),
('021647af-61a5-4075-9db3-bb5024ef7a67', 'Financeiro'),
('021647af-61a5-4075-9db3-bb5024ef7a67', 'Frota'),
('021647af-61a5-4075-9db3-bb5024ef7a67', 'Frota - Motorista'),
('021647af-61a5-4075-9db3-bb5024ef7a67', 'Higiene e Limpeza'),
('021647af-61a5-4075-9db3-bb5024ef7a67', 'Lavagem'),
('021647af-61a5-4075-9db3-bb5024ef7a67', 'Marketing'),
('021647af-61a5-4075-9db3-bb5024ef7a67', 'Obra - Manutenção'),
('021647af-61a5-4075-9db3-bb5024ef7a67', 'Oficina - Manutenção'),
('021647af-61a5-4075-9db3-bb5024ef7a67', 'Operacional'),
('021647af-61a5-4075-9db3-bb5024ef7a67', 'Pátio'),
('021647af-61a5-4075-9db3-bb5024ef7a67', 'Pintura'),
('021647af-61a5-4075-9db3-bb5024ef7a67', 'Portaria e Vigia'),
('021647af-61a5-4075-9db3-bb5024ef7a67', 'Psicologia'),
('021647af-61a5-4075-9db3-bb5024ef7a67', 'Rastreador'),
('021647af-61a5-4075-9db3-bb5024ef7a67', 'Recepção'),
('021647af-61a5-4075-9db3-bb5024ef7a67', 'Recursos Humanos e DP'),
('021647af-61a5-4075-9db3-bb5024ef7a67', 'Segurança do Trabalho'),
('021647af-61a5-4075-9db3-bb5024ef7a67', 'SGI - Sistema de Gestão Integrado'),
('021647af-61a5-4075-9db3-bb5024ef7a67', 'TI - Tecnologia da Informação');

-- Inserir 27 departamentos para Fike
INSERT INTO departments (company_id, name) VALUES
('5207e9eb-3ac3-462d-aede-07000792d4f5', 'Abastecimento'),
('5207e9eb-3ac3-462d-aede-07000792d4f5', 'Administrativo'),
('5207e9eb-3ac3-462d-aede-07000792d4f5', 'Almoxarifado'),
('5207e9eb-3ac3-462d-aede-07000792d4f5', 'Borracharia'),
('5207e9eb-3ac3-462d-aede-07000792d4f5', 'Carregamento'),
('5207e9eb-3ac3-462d-aede-07000792d4f5', 'Comercial'),
('5207e9eb-3ac3-462d-aede-07000792d4f5', 'Compras'),
('5207e9eb-3ac3-462d-aede-07000792d4f5', 'Diretoria'),
('5207e9eb-3ac3-462d-aede-07000792d4f5', 'Financeiro'),
('5207e9eb-3ac3-462d-aede-07000792d4f5', 'Frota'),
('5207e9eb-3ac3-462d-aede-07000792d4f5', 'Frota - Motorista'),
('5207e9eb-3ac3-462d-aede-07000792d4f5', 'Higiene e Limpeza'),
('5207e9eb-3ac3-462d-aede-07000792d4f5', 'Lavagem'),
('5207e9eb-3ac3-462d-aede-07000792d4f5', 'Marketing'),
('5207e9eb-3ac3-462d-aede-07000792d4f5', 'Obra - Manutenção'),
('5207e9eb-3ac3-462d-aede-07000792d4f5', 'Oficina - Manutenção'),
('5207e9eb-3ac3-462d-aede-07000792d4f5', 'Operacional'),
('5207e9eb-3ac3-462d-aede-07000792d4f5', 'Pátio'),
('5207e9eb-3ac3-462d-aede-07000792d4f5', 'Pintura'),
('5207e9eb-3ac3-462d-aede-07000792d4f5', 'Portaria e Vigia'),
('5207e9eb-3ac3-462d-aede-07000792d4f5', 'Psicologia'),
('5207e9eb-3ac3-462d-aede-07000792d4f5', 'Rastreador'),
('5207e9eb-3ac3-462d-aede-07000792d4f5', 'Recepção'),
('5207e9eb-3ac3-462d-aede-07000792d4f5', 'Recursos Humanos e DP'),
('5207e9eb-3ac3-462d-aede-07000792d4f5', 'Segurança do Trabalho'),
('5207e9eb-3ac3-462d-aede-07000792d4f5', 'SGI - Sistema de Gestão Integrado'),
('5207e9eb-3ac3-462d-aede-07000792d4f5', 'TI - Tecnologia da Informação');

-- Remapear employees.department
UPDATE employees SET department = 'Abastecimento' WHERE company_id IN ('021647af-61a5-4075-9db3-bb5024ef7a67', '5207e9eb-3ac3-462d-aede-07000792d4f5') AND department IN ('ABASTECIMENTO', 'POSTO DE ABASTECIMENTO');
UPDATE employees SET department = 'Almoxarifado' WHERE company_id IN ('021647af-61a5-4075-9db3-bb5024ef7a67', '5207e9eb-3ac3-462d-aede-07000792d4f5') AND department IN ('ALMOXARIFADO', 'ALMOX 1', 'ALMOX 2');
UPDATE employees SET department = 'Financeiro' WHERE company_id IN ('021647af-61a5-4075-9db3-bb5024ef7a67', '5207e9eb-3ac3-462d-aede-07000792d4f5') AND department IN ('FINANCEIRO', 'FINANCEIRO-ES');
UPDATE employees SET department = 'Frota - Motorista' WHERE company_id IN ('021647af-61a5-4075-9db3-bb5024ef7a67', '5207e9eb-3ac3-462d-aede-07000792d4f5') AND department = 'MOTORISTA';
UPDATE employees SET department = 'Marketing' WHERE company_id IN ('021647af-61a5-4075-9db3-bb5024ef7a67', '5207e9eb-3ac3-462d-aede-07000792d4f5') AND department = 'MARKETING';
UPDATE employees SET department = 'Obra - Manutenção' WHERE company_id IN ('021647af-61a5-4075-9db3-bb5024ef7a67', '5207e9eb-3ac3-462d-aede-07000792d4f5') AND department IN ('OBRA', 'MANUTENCAO/CONCERTO DE PISTOES', 'MANUTENCAO/CONSERTO DE PISTOES');
UPDATE employees SET department = 'Oficina - Manutenção' WHERE company_id IN ('021647af-61a5-4075-9db3-bb5024ef7a67', '5207e9eb-3ac3-462d-aede-07000792d4f5') AND department IN ('OFICINA', 'OFICINA 1', 'OFICINA 2', 'OFICINA 3', 'OFICINA 4');
UPDATE employees SET department = 'Pátio' WHERE company_id IN ('021647af-61a5-4075-9db3-bb5024ef7a67', '5207e9eb-3ac3-462d-aede-07000792d4f5') AND department = 'PATIO';
UPDATE employees SET department = 'Pintura' WHERE company_id IN ('021647af-61a5-4075-9db3-bb5024ef7a67', '5207e9eb-3ac3-462d-aede-07000792d4f5') AND department IN ('PINTURA 1', 'PINTURA CARRETAS', 'PINTURA CAVALOS');
UPDATE employees SET department = 'Portaria e Vigia' WHERE company_id IN ('021647af-61a5-4075-9db3-bb5024ef7a67', '5207e9eb-3ac3-462d-aede-07000792d4f5') AND department IN ('PORTARIA', 'ENTRADA VEICULOS');
UPDATE employees SET department = 'Recursos Humanos e DP' WHERE company_id IN ('021647af-61a5-4075-9db3-bb5024ef7a67', '5207e9eb-3ac3-462d-aede-07000792d4f5') AND department IN ('DEPARTAMENTO PESSOAL', 'recurso humanos', 'Recursos Humanos', 'RH');
UPDATE employees SET department = 'Segurança do Trabalho' WHERE company_id IN ('021647af-61a5-4075-9db3-bb5024ef7a67', '5207e9eb-3ac3-462d-aede-07000792d4f5') AND department = 'SEGURANCA TRABALHO';
UPDATE employees SET department = 'SGI - Sistema de Gestão Integrado' WHERE company_id IN ('021647af-61a5-4075-9db3-bb5024ef7a67', '5207e9eb-3ac3-462d-aede-07000792d4f5') AND department IN ('SGI - QUALIDADE E MEIO AMBIENTE', 'QUALIDADE', 'Qualidade', 'Meio Ambiente', 'ESTOQUE AUDITORIA POA');
UPDATE employees SET department = 'TI - Tecnologia da Informação' WHERE company_id IN ('021647af-61a5-4075-9db3-bb5024ef7a67', '5207e9eb-3ac3-462d-aede-07000792d4f5') AND department IN ('TI - TECNOLOGIA DE INFORMACAO', 'ANALISTA DE TI');
UPDATE employees SET department = 'Operacional' WHERE company_id IN ('021647af-61a5-4075-9db3-bb5024ef7a67', '5207e9eb-3ac3-462d-aede-07000792d4f5') AND department IN ('0', 'Não encontrado', 'PESSOAS SAIDA', 'RECICLAGEM - PIRACICABA', 'RECICLAGEM - PORTO ALEGRE');
UPDATE employees SET department = 'Administrativo' WHERE company_id IN ('021647af-61a5-4075-9db3-bb5024ef7a67', '5207e9eb-3ac3-462d-aede-07000792d4f5') AND department = 'ADMINISTRATIVO';
UPDATE employees SET department = 'Borracharia' WHERE company_id IN ('021647af-61a5-4075-9db3-bb5024ef7a67', '5207e9eb-3ac3-462d-aede-07000792d4f5') AND department = 'BORRACHARIA';
UPDATE employees SET department = 'Carregamento' WHERE company_id IN ('021647af-61a5-4075-9db3-bb5024ef7a67', '5207e9eb-3ac3-462d-aede-07000792d4f5') AND department = 'CARREGAMENTO';
UPDATE employees SET department = 'Comercial' WHERE company_id IN ('021647af-61a5-4075-9db3-bb5024ef7a67', '5207e9eb-3ac3-462d-aede-07000792d4f5') AND department = 'COMERCIAL';
UPDATE employees SET department = 'Compras' WHERE company_id IN ('021647af-61a5-4075-9db3-bb5024ef7a67', '5207e9eb-3ac3-462d-aede-07000792d4f5') AND department = 'COMPRAS';
UPDATE employees SET department = 'Diretoria' WHERE company_id IN ('021647af-61a5-4075-9db3-bb5024ef7a67', '5207e9eb-3ac3-462d-aede-07000792d4f5') AND department = 'DIRETORIA';
UPDATE employees SET department = 'Higiene e Limpeza' WHERE company_id IN ('021647af-61a5-4075-9db3-bb5024ef7a67', '5207e9eb-3ac3-462d-aede-07000792d4f5') AND department = 'HIGIENE E LIMPEZA';
UPDATE employees SET department = 'Lavagem' WHERE company_id IN ('021647af-61a5-4075-9db3-bb5024ef7a67', '5207e9eb-3ac3-462d-aede-07000792d4f5') AND department = 'LAVAGEM';
UPDATE employees SET department = 'Operacional' WHERE company_id IN ('021647af-61a5-4075-9db3-bb5024ef7a67', '5207e9eb-3ac3-462d-aede-07000792d4f5') AND department = 'OPERACIONAL';
UPDATE employees SET department = 'Psicologia' WHERE company_id IN ('021647af-61a5-4075-9db3-bb5024ef7a67', '5207e9eb-3ac3-462d-aede-07000792d4f5') AND department = 'PSICOLOGIA';
UPDATE employees SET department = 'Rastreador' WHERE company_id IN ('021647af-61a5-4075-9db3-bb5024ef7a67', '5207e9eb-3ac3-462d-aede-07000792d4f5') AND department = 'RASTREADOR';
UPDATE employees SET department = 'Frota' WHERE company_id IN ('021647af-61a5-4075-9db3-bb5024ef7a67', '5207e9eb-3ac3-462d-aede-07000792d4f5') AND department = 'FROTA';
