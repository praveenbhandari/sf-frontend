"use client";

import { useId, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import Button from "@/components/ui/Button";
import { ADDRESS_TYPES, type AddressInput } from "@/lib/contacts/types";

const CONTROL =
  "w-full rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 transition-colors focus:border-primary focus:bg-input";

const MAX_ADDRESSES = 10;

type Row = AddressInput & { key: number };

const TEXT_FIELDS = [
  { name: "address", label: "Street", placeholder: "1 Market St, Suite 400", maxLength: 300, wide: true },
  { name: "city", label: "City", placeholder: "San Francisco", maxLength: 120 },
  { name: "state", label: "State / region", placeholder: "CA", maxLength: 120 },
  { name: "postal_code", label: "Postal code", placeholder: "94105", maxLength: 20 },
  { name: "country", label: "Country", placeholder: "USA", maxLength: 120 },
] as const;

function toRows(addresses: AddressInput[]): Row[] {
  return addresses.map((item, index) => ({ ...item, key: index }));
}

function toPayload(rows: Row[]): AddressInput[] {
  return rows.map((row) => ({
    type: row.type,
    address: row.address,
    city: row.city,
    state: row.state,
    postal_code: row.postal_code,
    country: row.country,
  }));
}

/**
 * Dynamic list of address rows for the contact form. The rows are serialized
 * into one hidden JSON input named `addresses`, which the server action parses
 * back into the array the API expects.
 */
export default function AddressListField({
  defaultValue = [],
}: {
  defaultValue?: AddressInput[];
}) {
  const idPrefix = useId();
  const [rows, setRows] = useState<Row[]>(() => toRows(defaultValue));
  const [nextKey, setNextKey] = useState(defaultValue.length);

  function addRow() {
    setRows([
      ...rows,
      {
        key: nextKey,
        type: "Home",
        address: "",
        city: null,
        state: null,
        postal_code: null,
        country: null,
      },
    ]);
    setNextKey(nextKey + 1);
  }

  function removeRow(key: number) {
    setRows(rows.filter((row) => row.key !== key));
  }

  function updateRow(key: number, patch: Partial<AddressInput>) {
    setRows(rows.map((row) => (row.key === key ? { ...row, ...patch } : row)));
  }

  const serialized = JSON.stringify(toPayload(rows));

  return (
    <div className="space-y-4">
      <input type="hidden" name="addresses" value={serialized} />

      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No addresses yet.</p>
      ) : null}

      {rows.map((row, index) => (
        <div key={row.key} className="space-y-3 rounded-md border border-border p-4">
          <div className="flex items-end justify-between gap-2">
            <div className="w-40">
              <label
                htmlFor={`${idPrefix}-type-${row.key}`}
                className="mb-1.5 block text-[13px] font-medium text-foreground"
              >
                Type
              </label>
              <select
                id={`${idPrefix}-type-${row.key}`}
                value={row.type}
                onChange={(event) =>
                  updateRow(row.key, { type: event.target.value as AddressInput["type"] })
                }
                className={CONTROL}
              >
                {ADDRESS_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              aria-label={`Remove address ${index + 1}`}
              onClick={() => removeRow(row.key)}
            >
              <Trash2 className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
              Remove
            </Button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {TEXT_FIELDS.map((field) => (
              <div key={field.name} className={"wide" in field && field.wide ? "sm:col-span-2" : undefined}>
                <label
                  htmlFor={`${idPrefix}-${field.name}-${row.key}`}
                  className="mb-1.5 block text-[13px] font-medium text-foreground"
                >
                  {field.label}
                </label>
                <input
                  id={`${idPrefix}-${field.name}-${row.key}`}
                  type="text"
                  value={row[field.name] ?? ""}
                  maxLength={field.maxLength}
                  placeholder={field.placeholder}
                  onChange={(event) =>
                    updateRow(row.key, { [field.name]: event.target.value })
                  }
                  className={CONTROL}
                />
              </div>
            ))}
          </div>
        </div>
      ))}

      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={addRow}
        disabled={rows.length >= MAX_ADDRESSES}
      >
        <Plus className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
        Add address
      </Button>
    </div>
  );
}
