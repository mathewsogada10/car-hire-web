import { f, ref, options, vehicle, notes, name } from "./fields";

export const fleetSchemas = {
  vehicles: {
    title: "Vehicles",
    fields: [
      f("registration", "Registration"),
      f("make", "Make"),
      f("model", "Model"),
      f("year", "Year", "number", true),
      options("status", "Status", [
        "Available",
        "Hired",
        "Under Service",
        "Inactive",
        "Sold",
      ]),
      f("odometerKm", "Odometer (km)", "number", true),
      f("correctionReason", "Odometer correction reason", "text", true),
      notes,
    ],
  },
  customers: {
    title: "Customers",
    fields: [
      name,
      f("phone", "Phone", "text", true),
      f("email", "Email", "email", true),
      f("licenceRef", "Licence reference (optional)", "text", true),
      f("emergencyContact", "Emergency contact", "text", true),
      notes,
    ],
  },
  hires: {
    title: "Hires",
    fields: [
      vehicle,
      ref("customerId", "Customer", "customers"),
      f("plannedStart", "Planned pickup (local time)", "instant"),
      f("plannedEnd", "Planned return (local time)", "instant"),
      options("status", "Status", [
        "Draft",
        "Booked",
        "Active",
        "Completed",
        "Cancelled",
      ]),
      f("chargeMinor", "Agreed charge (KES)", "money"),
      f(
        "zeroChargeConfirmed",
        "I confirm this is a zero-charge hire",
        "boolean",
      ),
      f("actualStart", "Actual pickup (local time)", "instant", true),
      f("actualEnd", "Actual return (local time)", "instant", true),
      f("itinerary", "Itinerary", "text", true),
      notes,
    ],
  },
};
