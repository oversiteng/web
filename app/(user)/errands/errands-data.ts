export interface ErrandOption {
  id: string;
  title: string;
  subtitle: string;
  label: string;
  placeholder: string;
  locationPlaceholder: string;
}

export const ERRAND_OPTIONS: ErrandOption[] = [
  {
    id: "building-material",
    title: "Building material cost",
    subtitle: "Find out current pricing for building material",
    label: "Materials for Price Inquiry",
    placeholder: "List the materials to price (e.g. Dangote cement 42.5R per bag, 12mm & 16mm TMT rebar per ton, sharp sand tipper), brands, and specifications for current market survey...",
    locationPlaceholder: "Target market or supplier location (e.g. Alaba market, Odunade, or local building depots)",
  },
  {
    id: "document-delivery",
    title: "Document delivery",
    subtitle: "Pick and drop off papers",
    label: "Document & Dispatch Details",
    placeholder: "Describe documents to pick up, contact person at pick-up, drop-off location, and recipient contact information...",
    locationPlaceholder: "Pickup address & delivery destination",
  },
  {
    id: "utility-payment",
    title: "Utility bill payment",
    subtitle: "Pay for utility, rent or livies",
    label: "Utility & Billing Information",
    placeholder: "State utility provider (e.g. EKEDC, IBEDC, Water Board, Estate Dues), meter/account number, and exact payment details...",
    locationPlaceholder: "Property or billing office address",
  },
  {
    id: "parcel-pickup",
    title: "Parcel pickup",
    subtitle: "Collect package on your behalf",
    label: "Package & Courier Details",
    placeholder: "Describe the package, weight/dimensions, logistics dispatch center/waybill number, and receiving instructions...",
    locationPlaceholder: "Pickup depot & recipient delivery address",
  },
  {
    id: "something-else",
    title: "Something else",
    subtitle: "Describe it yourself",
    label: "Errand Description & Instructions",
    placeholder: "Provide detailed instructions on what needs to be verified, who our agent should meet, and any specific steps...",
    locationPlaceholder: "Errand location / meeting address",
  },
];
