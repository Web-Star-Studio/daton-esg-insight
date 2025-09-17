-- Populate GRI Indicators Library with Standard GRI Indicators

-- Insert Universal Standards (Mandatory)
INSERT INTO public.gri_indicators_library (code, title, description, indicator_type, gri_standard, data_type, is_mandatory, guidance_text) VALUES
-- GRI 2: General Disclosures (Universal Standards)
('2-1', 'Organizational details', 'Report the name of the organization, nature of ownership and legal form, location of headquarters, and countries of operation.', 'Universal', 'GRI 2', 'text', true, 'Include organization name, legal form, headquarters location, and operational countries.'),
('2-2', 'Entities included in sustainability reporting', 'Report entities included in the organization''s sustainability reporting and whether all entities are included.', 'Universal', 'GRI 2', 'text', true, 'List all entities included and explain any exclusions.'),
('2-3', 'Reporting period, frequency and contact point', 'Report the reporting period and frequency, and contact point for questions about the report.', 'Universal', 'GRI 2', 'text', true, 'Specify reporting period, frequency, and provide contact information.'),
('2-4', 'Restatements of information', 'Report restatements of information given in previous reports and reasons for such restatements.', 'Universal', 'GRI 2', 'text', true, 'Explain any restatements and their reasons.'),
('2-5', 'External assurance', 'Report the organization''s policy and current practice with regard to seeking external assurance for the report.', 'Universal', 'GRI 2', 'text', true, 'Describe external assurance policy and current practices.'),

-- Activities and workers
('2-6', 'Activities, value chain and other business relationships', 'Report the organization''s sector, value chain, and other business relationships.', 'Universal', 'GRI 2', 'text', true, 'Describe main activities, products/services, markets, value chain and business relationships.'),
('2-7', 'Employees', 'Report the total number of employees by employment contract, employment type, and region.', 'Universal', 'GRI 2', 'numeric', true, 'Provide breakdown of employees by contract type, employment type, and geographical region.'),
('2-8', 'Workers who are not employees', 'Report the total number of workers who are not employees and describe the work performed.', 'Universal', 'GRI 2', 'numeric', true, 'Include contractors, consultants, and other non-employee workers.'),

-- Governance
('2-9', 'Governance structure and composition', 'Report the governance structure and composition of the highest governance body.', 'Universal', 'GRI 2', 'text', true, 'Describe board structure, committees, and composition including diversity.'),
('2-10', 'Nomination and selection of the highest governance body', 'Report the nomination and selection processes for the highest governance body and its committees.', 'Universal', 'GRI 2', 'text', true, 'Explain nomination criteria, selection process, and stakeholder involvement.'),
('2-11', 'Chair of the highest governance body', 'Report whether the chair of the highest governance body is also a senior executive.', 'Universal', 'GRI 2', 'boolean', true, 'Indicate if chair also serves as senior executive and explain reasons.'),

-- Strategy, policies and practices
('2-22', 'Statement on sustainable development strategy', 'Report a statement from the highest governance body or most senior executive about the relevance of sustainable development.', 'Universal', 'GRI 2', 'text', true, 'Include leadership statement on sustainability strategy and commitments.'),
('2-23', 'Policy commitments', 'Report the organization''s policy commitments for responsible business conduct.', 'Universal', 'GRI 2', 'text', true, 'Describe policies on human rights, labor practices, environment, and anti-corruption.'),

-- Stakeholder engagement
('2-29', 'Approach to stakeholder engagement', 'Report the organization''s approach to engaging with stakeholders.', 'Universal', 'GRI 2', 'text', true, 'Describe stakeholder identification, engagement methods, and frequency.'),

-- Environmental Standards
('301-1', 'Materials used by weight or volume', 'Report the total weight or volume of materials used to produce and package products and services.', 'Environmental', 'GRI 301', 'numeric', false, 'Include renewable and non-renewable materials used during the reporting period.'),
('301-2', 'Recycled input materials used', 'Report the percentage of recycled input materials used to manufacture products and services.', 'Environmental', 'GRI 301', 'percentage', false, 'Calculate as percentage of total materials used.'),

('302-1', 'Energy consumption within the organization', 'Report total fuel consumption within the organization from non-renewable and renewable sources.', 'Environmental', 'GRI 302', 'numeric', false, 'Include fuel consumption, electricity, heating, cooling, and steam in joules or multiples.'),
('302-2', 'Energy consumption outside of the organization', 'Report energy consumption outside of the organization.', 'Environmental', 'GRI 302', 'numeric', false, 'Report energy consumption from activities outside organizational boundaries.'),
('302-3', 'Energy intensity', 'Report the energy intensity ratio for the organization.', 'Environmental', 'GRI 302', 'numeric', false, 'Calculate energy consumption per unit of organizational activity.'),
('302-4', 'Reduction of energy consumption', 'Report the amount of reductions in energy consumption achieved as a direct result of conservation initiatives.', 'Environmental', 'GRI 302', 'numeric', false, 'Report energy reductions in joules or multiples.'),

('303-1', 'Interactions with water as a shared resource', 'Report how the organization interacts with water, including how and where water is withdrawn, consumed, and discharged.', 'Environmental', 'GRI 303', 'text', false, 'Describe water sources, quality impacts, and stakeholder concerns.'),
('303-2', 'Management of water discharge-related impacts', 'Report the approach used to identify water discharge-related impacts and how they are addressed.', 'Environmental', 'GRI 303', 'text', false, 'Describe approach to managing water discharge impacts.'),
('303-3', 'Water withdrawal', 'Report the total volume of water withdrawn, with a breakdown by source.', 'Environmental', 'GRI 303', 'numeric', false, 'Report in megalitres and break down by source type.'),
('303-4', 'Water discharge', 'Report the total volume of water discharge, with a breakdown by destination.', 'Environmental', 'GRI 303', 'numeric', false, 'Report in megalitres and break down by destination and treatment level.'),
('303-5', 'Water consumption', 'Report the total volume of water consumption and change in water storage.', 'Environmental', 'GRI 303', 'numeric', false, 'Report in megalitres as withdrawal minus discharge.'),

('305-1', 'Direct (Scope 1) GHG emissions', 'Report gross direct (Scope 1) GHG emissions in metric tons of CO2 equivalent.', 'Environmental', 'GRI 305', 'numeric', false, 'Include all direct emissions from owned or controlled sources.'),
('305-2', 'Energy indirect (Scope 2) GHG emissions', 'Report gross location-based energy indirect (Scope 2) GHG emissions in metric tons of CO2 equivalent.', 'Environmental', 'GRI 305', 'numeric', false, 'Include emissions from consumption of purchased electricity, heat, or steam.'),
('305-3', 'Other indirect (Scope 3) GHG emissions', 'Report gross other indirect (Scope 3) GHG emissions in metric tons of CO2 equivalent.', 'Environmental', 'GRI 305', 'numeric', false, 'Include other indirect emissions in the organization''s value chain.'),
('305-4', 'GHG emissions intensity', 'Report the GHG emissions intensity ratio for the organization.', 'Environmental', 'GRI 305', 'numeric', false, 'Express as metric tons CO2 equivalent per unit of organizational activity.'),
('305-5', 'Reduction of GHG emissions', 'Report GHG emissions reduced as a direct result of reduction initiatives, in metric tons of CO2 equivalent.', 'Environmental', 'GRI 305', 'numeric', false, 'Report baseline, initiatives, and quantified emission reductions.'),

('306-1', 'Waste generation and significant waste-related impacts', 'Report how the organization identifies waste-related impacts and how it manages them.', 'Environmental', 'GRI 306', 'text', false, 'Describe approach to identifying and managing waste impacts.'),
('306-2', 'Management of significant waste-related impacts', 'Report actions taken to manage waste-related impacts, including circular economy approaches.', 'Environmental', 'GRI 306', 'text', false, 'Describe waste management actions and circular economy initiatives.'),
('306-3', 'Waste generated', 'Report the total weight of waste generated in metric tons, and a breakdown by composition.', 'Environmental', 'GRI 306', 'numeric', false, 'Break down by waste composition and whether waste data is estimated.'),
('306-4', 'Waste diverted from disposal', 'Report the total weight of waste diverted from disposal in metric tons, and a breakdown by composition and recovery operation.', 'Environmental', 'GRI 306', 'numeric', false, 'Include waste diverted through reuse, recycling, and other recovery operations.'),
('306-5', 'Waste directed to disposal', 'Report the total weight of waste directed to disposal in metric tons, and a breakdown by composition and disposal operation.', 'Environmental', 'GRI 306', 'numeric', false, 'Include waste directed to incineration, landfill, and other disposal operations.'),

-- Social Standards
('401-1', 'New employee hires and employee turnover', 'Report the total number and rates of new employee hires and employee turnover during the reporting period, by age group, gender, and region.', 'Social', 'GRI 401', 'numeric', false, 'Break down by age group, gender, and region.'),
('401-2', 'Benefits provided to full-time employees that are not provided to temporary or part-time employees', 'Report benefits which are standard for full-time employees but are not provided to temporary or part-time employees.', 'Social', 'GRI 401', 'text', false, 'List benefits by significant locations of operation.'),
('401-3', 'Parental leave', 'Report the total number of employees entitled to parental leave, by gender, and the return to work and retention rates of employees who took parental leave.', 'Social', 'GRI 401', 'numeric', false, 'Include return and retention rates by gender.'),

('403-1', 'Occupational health and safety management system', 'Report whether an occupational health and safety management system has been implemented.', 'Social', 'GRI 403', 'boolean', false, 'Describe the management system scope and whether it has been audited.'),
('403-2', 'Hazard identification, risk assessment, and incident investigation', 'Report the processes used to identify work-related hazards and assess risks on a routine and non-routine basis.', 'Social', 'GRI 403', 'text', false, 'Describe hazard identification and incident investigation processes.'),
('403-9', 'Work-related injuries', 'Report the number and rate of fatalities as a result of work-related injury, high-consequence work-related injuries, and recordable work-related injuries.', 'Social', 'GRI 403', 'numeric', false, 'Include rates calculated per hours worked.'),
('403-10', 'Work-related ill health', 'Report the number of fatalities as a result of work-related ill health, and cases of recordable work-related ill health.', 'Social', 'GRI 403', 'numeric', false, 'Include rates calculated per hours worked.'),

('404-1', 'Average hours of training per year per employee', 'Report the average hours of training that employees have undertaken during the reporting period, by gender and employee category.', 'Social', 'GRI 404', 'numeric', false, 'Break down by gender and employee category.'),
('404-2', 'Programs for upgrading employee skills and transition assistance programs', 'Report the type and scope of programs implemented and assistance provided to upgrade employee skills.', 'Social', 'GRI 404', 'text', false, 'Include skills management and lifelong learning programs.'),
('404-3', 'Percentage of employees receiving regular performance and career development reviews', 'Report the percentage of total employees by gender and employee category who received a regular performance and career development review.', 'Social', 'GRI 404', 'percentage', false, 'Break down by gender and employee category.'),

('405-1', 'Diversity of governance bodies and employees', 'Report the percentage of individuals within governance bodies in each diversity category.', 'Social', 'GRI 405', 'percentage', false, 'Include age, gender, and other diversity indicators.'),
('405-2', 'Ratio of basic salary and remuneration of women to men', 'Report the ratio of the basic salary and remuneration of women to men for each employee category.', 'Social', 'GRI 405', 'numeric', false, 'Calculate ratio by employee category and significant locations.'),

-- Economic Standards
('201-1', 'Direct economic value generated and distributed', 'Report the direct economic value generated and distributed on an accruals basis.', 'Economic', 'GRI 201', 'numeric', false, 'Include revenues, operating costs, employee wages and benefits, payments to providers of capital, payments to government, and community investments.'),
('201-2', 'Financial implications and other risks and opportunities due to climate change', 'Report financial implications and other risks and opportunities for activities due to climate change.', 'Economic', 'GRI 201', 'text', false, 'Include physical and transition risks and opportunities.'),
('201-3', 'Defined benefit plan obligations and other retirement plans', 'Report the organization''s defined benefit plan obligations and other retirement plans.', 'Economic', 'GRI 201', 'numeric', false, 'Include coverage of defined benefit plan obligations.'),
('201-4', 'Financial assistance received from government', 'Report the total monetary value of financial assistance received by the organization from any government.', 'Economic', 'GRI 201', 'numeric', false, 'Break down by country and type of assistance.'),

('205-1', 'Operations assessed for risks related to corruption', 'Report the total number and percentage of operations assessed for risks related to corruption.', 'Economic', 'GRI 205', 'percentage', false, 'Include significant risks identified through risk assessments.'),
('205-2', 'Communication and training about anti-corruption policies and procedures', 'Report the total number and percentage of governance body members, employees, and business partners that have received communication and training on anti-corruption.', 'Economic', 'GRI 205', 'percentage', false, 'Break down by region and employee category.'),
('205-3', 'Confirmed incidents of corruption and actions taken', 'Report the total number of confirmed incidents of corruption and actions taken.', 'Economic', 'GRI 205', 'numeric', false, 'Include number of incidents and actions taken.');

-- Insert default report sections
INSERT INTO public.gri_report_sections (report_id, section_key, title, content, is_complete) 
SELECT 
    gr.id,
    'ceo_message',
    'CEO Message',
    '',
    false
FROM public.gri_reports gr
WHERE NOT EXISTS (
    SELECT 1 FROM public.gri_report_sections grs 
    WHERE grs.report_id = gr.id AND grs.section_key = 'ceo_message'
);

INSERT INTO public.gri_report_sections (report_id, section_key, title, content, is_complete) 
SELECT 
    gr.id,
    'executive_summary',
    'Executive Summary',
    '',
    false
FROM public.gri_reports gr
WHERE NOT EXISTS (
    SELECT 1 FROM public.gri_report_sections grs 
    WHERE grs.report_id = gr.id AND grs.section_key = 'executive_summary'
);

INSERT INTO public.gri_report_sections (report_id, section_key, title, content, is_complete) 
SELECT 
    gr.id,
    'methodology',
    'Methodology',
    '',
    false
FROM public.gri_reports gr
WHERE NOT EXISTS (
    SELECT 1 FROM public.gri_report_sections grs 
    WHERE grs.report_id = gr.id AND grs.section_key = 'methodology'
);

INSERT INTO public.gri_report_sections (report_id, section_key, title, content, is_complete) 
SELECT 
    gr.id,
    'materiality_analysis',
    'Materiality Analysis',
    '',
    false
FROM public.gri_reports gr
WHERE NOT EXISTS (
    SELECT 1 FROM public.gri_report_sections grs 
    WHERE grs.report_id = gr.id AND grs.section_key = 'materiality_analysis'
);

INSERT INTO public.gri_report_sections (report_id, section_key, title, content, is_complete) 
SELECT 
    gr.id,
    'stakeholder_engagement',
    'Stakeholder Engagement',
    '',
    false
FROM public.gri_reports gr
WHERE NOT EXISTS (
    SELECT 1 FROM public.gri_report_sections grs 
    WHERE grs.report_id = gr.id AND grs.section_key = 'stakeholder_engagement'
);

-- Initialize indicator data for existing reports
INSERT INTO public.gri_indicator_data (report_id, indicator_id, is_complete)
SELECT DISTINCT gr.id, gil.id, false
FROM public.gri_reports gr
CROSS JOIN public.gri_indicators_library gil
WHERE gil.is_mandatory = true
AND NOT EXISTS (
    SELECT 1 FROM public.gri_indicator_data gid 
    WHERE gid.report_id = gr.id AND gid.indicator_id = gil.id
);