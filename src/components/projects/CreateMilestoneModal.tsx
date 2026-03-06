/**
 * CreateMilestoneModal
 * Create a custom milestone from templates. Type selector + config inputs; guide copy per plan.
 */

import { useState, useEffect, useCallback } from "react";
import { Modal, Button, Input, Select } from "../common";
import { useToast } from "../../contexts/ToastContext";
import { getMilestoneTypes, createMilestone } from "../../services/milestones.service";
import type { MilestoneType } from "../../types/api.types";
import type { CreateMilestoneInput } from "../../types/api.types";
import type { SelectOption } from "../common";

export interface CreateMilestoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** When provided, only project-scoped and global types are shown; milestone is created for this project. */
  projectId?: string;
  projectName?: string;
  onCreated: () => void;
}

function configSchemaToOptions(schema: unknown): { key: string; options: SelectOption[] }[] {
  if (!schema || typeof schema !== "object") return [];
  const entries = Object.entries(schema as Record<string, unknown>);
  return entries
    .filter(([, v]) => Array.isArray(v) && v.length > 0)
    .map(([key, v]) => {
      const arr = v as number[];
      return {
        key,
        options: arr.map((val) => ({ value: String(val), label: String(val) })),
      };
    });
}

export function CreateMilestoneModal({
  isOpen,
  onClose,
  projectId,
  projectName,
  onCreated,
}: CreateMilestoneModalProps) {
  const [types, setTypes] = useState<MilestoneType[]>([]);
  const [loadingTypes, setLoadingTypes] = useState(false);
  const [selectedType, setSelectedType] = useState<MilestoneType | null>(null);
  const [config, setConfig] = useState<Record<string, unknown>>({});
  const [name, setName] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  const loadTypes = useCallback(async () => {
    setLoadingTypes(true);
    try {
      const data = await getMilestoneTypes();
      setTypes(data);
      setSelectedType(null);
      setConfig({});
      setName("");
    } finally {
      setLoadingTypes(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) loadTypes();
  }, [isOpen, loadTypes]);

  const filteredTypes = projectId
    ? types
    : types.filter((t) => t.scope === "global");

  const configFields = selectedType?.configSchema
    ? configSchemaToOptions(selectedType.configSchema)
    : [];

  useEffect(() => {
    if (!selectedType) {
      setConfig({});
      return;
    }
    const fields = configSchemaToOptions(selectedType.configSchema);
    const initial: Record<string, unknown> = {};
    fields.forEach(({ key, options }) => {
      if (options[0]) initial[key] = Number(options[0].value) || options[0].value;
    });
    setConfig(initial);
  }, [selectedType]);

  const handleSubmit = async () => {
    if (!selectedType) return;
    const configObj: Record<string, unknown> = {};
    Object.keys(config).forEach((k) => {
      const v = config[k];
      configObj[k] = typeof v === "string" && /^\d+\.?\d*$/.test(v) ? Number(v) : v;
    });
    setSubmitLoading(true);
    setError(null);
    try {
      const input: CreateMilestoneInput = {
        typeSlug: selectedType.slug,
        config: configObj,
        name: name.trim() || undefined,
      };
      if (projectId) input.projectId = projectId;
      await createMilestone(input);
      onCreated();
      onClose();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to create milestone";
      setError(msg);
      toast?.showToast(msg, "error");
    } finally {
      setSubmitLoading(false);
    }
  };

  const canSubmit =
    selectedType &&
    configFields.every((f) => config[f.key] !== undefined && config[f.key] !== "") &&
    !submitLoading;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add milestone"
      size="large"
    >
      <div className="flex flex-col gap-4">
        <p className="text-text-muted text-sm">
          Pick a type and a number that feels like a stretch but doable. 5% and
          10% are great first milestones.
        </p>

        {loadingTypes ? (
          <p className="text-text-muted text-sm">Loading types…</p>
        ) : (
          <>
            <Select
              label="Milestone type"
              options={[
                { value: "", label: "Select a type…" },
                ...filteredTypes.map((t) => ({
                  value: t.slug,
                  label: t.name,
                })),
              ]}
              value={selectedType?.slug ?? ""}
              onChange={(e) => {
                const t = filteredTypes.find((x) => x.slug === e.target.value) ?? null;
                setSelectedType(t);
              }}
              aria-label="Milestone type"
            />

            {selectedType && configFields.length > 0 && (
              <div className="flex flex-col gap-2">
                {configFields.map(({ key, options }) => (
                  <Select
                    key={key}
                    label={key === "targetPercent" ? "Target %" : key === "targetKm" ? "Target (km)" : key === "targetWeeks" ? "Weeks" : key === "targetCount" ? "Count" : key}
                    options={options}
                    value={String(config[key] ?? options[0]?.value ?? "")}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        [key]: Number(e.target.value) || e.target.value,
                      }))
                    }
                  />
                ))}
              </div>
            )}

            <Input
              label="Name (optional)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={
                selectedType && config.targetPercent
                  ? `e.g. ${config.targetPercent}% of ${projectName ?? "project"}`
                  : "Leave blank to auto-generate"
              }
            />
          </>
        )}

        {error && <p className="text-danger text-sm">{error}</p>}

        <div className="flex gap-2 justify-end">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            className="min-h-[44px]"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="min-h-[44px]"
          >
            {submitLoading ? "Creating…" : "Add milestone"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
