import { describe, expect, it } from "vitest";
import { deriveDocumentValidity, expiresDuringTrip, inspectUpload, safeOriginalName } from "@/features/documents/helpers";
import { documentSchema } from "@/features/documents/schemas";
import type { TravelDocument } from "@/features/documents/types";

const valid={type:"passport",title:"Passaporte — Pedro",holderLabel:"Pedro",stopId:"",reservationId:"",travelLegId:"",issueDate:"2025-01-01",expiryDate:"2030-01-01",notes:"",requestId:"20000000-0000-4000-8000-000000000001"};
const document=(expiryDate:string|null):TravelDocument=>({id:"d",tripId:"t",type:"passport",title:"Passaporte",holderLabel:null,stopId:null,reservationId:null,travelLegId:null,issueDate:null,expiryDate,notes:null,needsReview:false,attachmentPath:null,attachmentName:null,attachmentMime:null,attachmentSize:null,updatedAt:"2026-01-01"});

describe("documents",()=>{
  it("accepts a metadata-only document",()=>expect(documentSchema.safeParse(valid).success).toBe(true));
  it("rejects invalid and reversed dates",()=>{expect(documentSchema.safeParse({...valid,issueDate:"not-a-date"}).success).toBe(false);expect(documentSchema.safeParse({...valid,expiryDate:"2024-12-31"}).success).toBe(false);});
  it("derives expiry status with a 90-day warning",()=>{expect(deriveDocumentValidity(null,"2026-09-01")).toBe("no_expiry");expect(deriveDocumentValidity("2026-08-31","2026-09-01")).toBe("expired");expect(deriveDocumentValidity("2026-11-30","2026-09-01")).toBe("expiring_soon");expect(deriveDocumentValidity("2027-01-01","2026-09-01")).toBe("valid");});
  it("warns when expiry precedes the Trip end",()=>{expect(expiresDuringTrip(document("2026-09-10"),"2026-09-15")).toBe(true);expect(expiresDuringTrip(document("2026-09-15"),"2026-09-15")).toBe(false);});
  it("inspects bytes rather than trusting the filename",async()=>{expect(await inspectUpload(new File([new Uint8Array([0x25,0x50,0x44,0x46])],"fake.exe"))).toBe("application/pdf");expect(await inspectUpload(new File([new Uint8Array([0x4d,0x5a])],"fake.pdf"))).toBeNull();});
  it("removes paths and unsafe characters from original names",()=>expect(safeOriginalName("../cartão<script>.pdf")).toBe("cartão_script_.pdf"));
});
