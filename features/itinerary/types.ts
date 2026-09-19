export type ItineraryStatus="active"|"needs_review";
export type ItineraryItem={id:string;tripId:string;tripDate:string;stopId:string|null;title:string;placeName:string|null;startLocalTime:string|null;endLocalTime:string|null;timezone:string|null;notes:string|null;sortOrder:number;status:ItineraryStatus;createdAt:string;updatedAt:string};
export type ItineraryValues={tripDate:string;stopId:string;title:string;placeName:string;startTime:string;endTime:string;timezone:string;notes:string;requestId:string};
export type ItineraryActionState={status:"idle"|"error";message?:string;fieldErrors?:Record<string,string>;values?:ItineraryValues};
export const initialItineraryActionState:ItineraryActionState={status:"idle"};
