import { PatientsTable } from "@/components/patients/patients-table"
import { RegisterPatientDialog } from "@/components/patients/register-patient-dialog"

export default function PatientsPage() {
  return (
    <div className="w-full max-w-full">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Patients</h1>
          <p className="text-muted-foreground mt-2">
            Manage and view all registered patients
          </p>
        </div>
        <RegisterPatientDialog />
      </div>
      <PatientsTable />
    </div>
  )
}

