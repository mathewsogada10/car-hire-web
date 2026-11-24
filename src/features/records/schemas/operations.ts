import { f, ref, options, vehicle, amount, date, notes, name } from "./fields";

export const operationsSchemas = {
  maintenance: {
    title: "Maintenance",
    fields: [
      vehicle,
      name,
      date,
      f("start", "Service starts (local time)", "instant"),
      f("end", "Service ends (local time)", "instant"),
      ref(
        "expenseId",
        "Linked expense (cost counted only there)",
        "expenses",
        true,
      ),
      f("nextDueDate", "Next due date", "date", true),
      f("nextDueKm", "Next due mileage", "number", true),
      notes,
    ],
  },
  reminders: {
    title: "Reminders",
    fields: [
      name,
      ref("vehicleId", "Vehicle", "vehicles", true),
      options("sourceType", "Source", [
        "Service",
        "Insurance",
        "Tracker",
        "Inspection",
        "Licence",
        "HireReturn",
        "Balance",
        "Backup",
        "Export",
        "Other",
      ]),
      f("dueDate", "Due date", "date", true),
      f("dueKm", "Due mileage (requires vehicle)", "number", true),
      options("status", "Status", [
        "Open",
        "Snoozed",
        "Completed",
        "Dismissed",
      ]),
      f("snoozedUntil", "Snoozed until", "date", true),
      notes,
    ],
  },
  readings: {
    title: "Odometer & fuel",
    fields: [
      vehicle,
      options("type", "Reading type", ["Odometer", "Fuel"]),
      f("value", "Reading value", "number"),
      date,
      f("correctionReason", "Correction reason", "text", true),
      notes,
    ],
  },
  conditions: {
    title: "Condition checks",
    fields: [
      ref("hireId", "Hire", "hires"),
      options("phase", "Inspection phase", ["PRE", "POST"]),
      f("odometerKm", "Odometer (km)", "number"),
      f("fuel", "Fuel level", "text", true),
      date,
      f("notes", "Condition / inspection notes", "textarea"),
    ],
  },
  damages: {
    title: "Fines & damages",
    fields: [
      ref("hireId", "Hire", "hires"),
      vehicle,
      name,
      amount,
      date,
      options("responsibility", "Responsibility", [
        "Customer",
        "Business",
        "Other",
      ]),
      options("status", "Status", ["Open", "Charged", "Waived", "Settled"]),
      notes,
    ],
  },
};
