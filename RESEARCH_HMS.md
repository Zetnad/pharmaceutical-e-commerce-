# MediHub HMS Research Notes

This document summarizes the online research used to reposition the existing MediHub codebase from a pharmaceutical marketplace into a hospital management system (HMS) with AI support.

## Why the redesign changed

The original product centered on medicine catalog browsing, pharmacy tenants, prescription upload, and e-commerce orders. Modern hospitals need a much broader operating model:

- patient registration and master records
- outpatient and inpatient workflows
- doctor, nurse, and clinical officer workspaces
- hospital pharmacy and medication safety
- billing, cashiering, insurance claims, and pre-authorization
- staff scheduling, credentialing, attendance, and payroll inputs
- analytics, governance, and AI oversight

## Online research sources reviewed

### Core hospital management system modules

- https://medinous.com/hospital-management-system-complete-guide/
- https://adrine.in/blog/hospital-management-system-features
- https://www.tactionsoft.com/blog/hospital-management-system-development-guide/

Common conclusions:

- modern HMS products usually combine 15-25 modules
- core modules include patient administration, EMR, billing, insurance, pharmacy, lab, HR, and inventory
- unified records and role-specific workflows matter more than isolated screens

### Hospital pharmacy requirements

- https://pharmacypro.io/blog/key-components-of-hospital-pharmacy-software
- https://www.appsrhino.com/blogs/hospital-pharmacy-inventory-management-best-practices
- ASHP guidance and statements on:
  - automated dispensing devices
  - barcode verification
  - prevention of medication errors

Common conclusions:

- perpetual inventory and par-level control are critical
- batch, expiry, and recall management are required
- barcode verification is a best practice across stocking, preparation, and dispensing
- interoperability with EHR/EMR and medication safety checks are expected

### Clinical officer workflow in East Africa

- https://human-resources-health.biomedcentral.com/articles/10.1186/1478-4491-11-32
- https://msf.or.ke/clinical-officer-1
- supporting overview pages on clinical officer duties

Common conclusions:

- clinical officers are frontline independent practitioners in many East African settings
- they often handle triage, diagnosis, treatment, emergency stabilization, ward coverage, and documentation
- a regional HMS should model clinical officers as a first-class role rather than forcing everything through a doctor-only flow

### Billing and insurance workflow

- https://www.experian.com/blogs/healthcare/6-steps-to-improving-the-claims-adjudication-process/
- https://experian.com/blogs/healthcare/claims-management-process-strategies-for-claims-acceptance-success
- coverage on prior authorization and denial management workflow trends

Common conclusions:

- denial prevention starts early at registration and admission, not only after discharge
- eligibility verification and pre-authorization visibility are essential
- claims scrubbing, documentation checks, and denial queues should be built into the workflow
- payer-specific rules and remittance transparency matter for revenue-cycle control

### Workforce, staffing, and payroll

- https://www.qgenda.com/blog/the-ultimate-guide-to-healthcare-workforce-management/
- https://www.timetrex.com/blog/hospital-staff-scheduling-best-practices
- https://www.adp.com/resources/articles-and-insights/articles/s/simplify-healthcare-payroll-and-hr-stay-compliant-save-time.aspx

Common conclusions:

- healthcare staffing must balance patient safety, staff wellbeing, and cost control
- rosters should account for 24/7 shifts, overtime, on-call, and credential scope
- payroll needs inputs from attendance, shift differentials, and locum cover
- license and certification tracking should sit close to workforce planning

### AI in hospitals

- NHS England guidance on AI-enabled ambient scribing products
- https://intuitionlabs.ai/articles/ai-hospital-operations-2025-trends
- recent digital medicine discussion on ambient AI and coding risk

Common conclusions:

- high-value AI use cases include ambient scribing, triage support, queue prioritization, coding support, and bed management
- AI should support staff, not replace professional judgment
- hospitals should assign explicit clinical safety ownership and perform privacy/risk review
- auditability, transparency, and monitoring for bias or coding inflation are important

## Recommended module blueprint for this codebase

### 1. Patient administration

- patient registration
- master patient record / MRN
- appointments and queue management
- consent capture and demographic updates

### 2. Clinical operations

- outpatient encounters
- inpatient admission and discharge
- doctor notes
- nurse tasking and observations
- clinical officer workflows

### 3. Orders and ancillary services

- lab requests and result tracking
- imaging / radiology requests
- procedure and theatre scheduling

### 4. Hospital pharmacy

- formulary
- e-prescriptions
- batch and expiry tracking
- dispensing and ward issue
- controlled register
- medication safety prompts

### 5. Billing and insurance

- cashiering
- mobile money/card receipts
- insurance eligibility
- pre-authorizations
- claims preparation and submission
- remittance and denial management

### 6. Workforce and HR

- staff profile and credentialing
- schedules and shift rosters
- attendance and overtime
- payroll-ready summaries

### 7. Executive and governance layer

- occupancy and service-line dashboards
- branch performance
- stockout and expiry risk
- audit logs and role-based access
- AI governance and safety review

## Implementation strategy chosen in this pass

A full backend rewrite was not realistic in one iteration, so this pass focused on:

1. replacing the public-facing marketplace homepage with an HMS narrative
2. repurposing the staff and admin dashboards into hospital operations dashboards
3. rewriting legal copy around hospital workflows and AI governance
4. making the AI endpoint usable even without external AI or database configuration
5. aligning the backend entry point with the new positioning

## Recommended next technical phases

### Phase 2: Backend vocabulary shift

Replace marketplace-specific entities with healthcare entities:

- `Pharmacist` -> `Facility` or `Department`
- `Product` -> `Medication`, `SupplyItem`, or `Service`
- `Order` -> `DispenseOrder`, `EncounterCharge`, or `Claim`
- expand `User` roles to include doctor, nurse, clinical officer, pharmacist, finance, HR, admin

### Phase 3: First-class hospital APIs

Add:

- patient registration and encounter APIs
- triage and admissions APIs
- insurance and claim APIs
- staff roster and attendance APIs
- pharmacy issue and reconciliation APIs

### Phase 4: Interoperability and compliance

Add:

- FHIR-aligned contracts where practical
- stronger audit and access-control coverage
- retention and approval workflows
- organization-level AI governance controls
