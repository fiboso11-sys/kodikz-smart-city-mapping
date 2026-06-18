export type PermitStatus = "Ongoing" | "Completed" | "On Hold" | "Expired";

export interface PermitMaster {
  id: string;
  permitNumber: string;
  projectName: string;
  companyName: string;
  contactPerson: string;
  contactNumber: string;
  startDate: string;
  endDate: string;
  status: PermitStatus;
  approvedAreaName: string;
  assignedVehicleIds: string[];
  comments: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePermitInput {
  permitNumber: string;
  projectName: string;
  companyName: string;
  contactPerson: string;
  contactNumber?: string;
  startDate: string;
  endDate: string;
  status?: PermitStatus;
  approvedAreaName?: string;
  assignedVehicleIds?: string[];
  comments?: string;
}

export type UpdatePermitInput = Partial<CreatePermitInput>;
