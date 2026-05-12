import React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import type { Question, QuestionOption } from "./types";

interface QuestionFieldProps {
  question: Question;
  value: string | string[] | undefined;
  onChange: (next: string | string[]) => void;
}

export const QuestionField: React.FC<QuestionFieldProps> = ({ question, value, onChange }) => {
  const renderOptionRow = (option: QuestionOption, control: React.ReactNode) => (
    <div
      key={option.id}
      className="flex items-start gap-3 rounded-md border border-transparent px-3 py-2 hover:bg-muted/40"
    >
      {control}
      <Label
        htmlFor={`${question.id}-${option.id}`}
        className="cursor-pointer text-sm font-normal leading-snug"
      >
        {option.label}
      </Label>
    </div>
  );

  if (question.type === "single") {
    const current = typeof value === "string" ? value : "";
    return (
      <RadioGroup value={current} onValueChange={onChange}>
        {question.options?.map((option) =>
          renderOptionRow(
            option,
            <RadioGroupItem
              id={`${question.id}-${option.id}`}
              value={option.id}
              className="mt-0.5"
            />,
          ),
        )}
      </RadioGroup>
    );
  }

  if (question.type === "multi") {
    const current = Array.isArray(value) ? value : [];
    const toggle = (optionId: string) => {
      const next = current.includes(optionId)
        ? current.filter((v) => v !== optionId)
        : [...current, optionId];
      onChange(next);
    };
    return (
      <div className="space-y-1">
        {question.options?.map((option) =>
          renderOptionRow(
            option,
            <Checkbox
              id={`${question.id}-${option.id}`}
              checked={current.includes(option.id)}
              onCheckedChange={() => toggle(option.id)}
              className="mt-0.5"
            />,
          ),
        )}
      </div>
    );
  }

  if (question.type === "textarea") {
    return (
      <Textarea
        value={typeof value === "string" ? value : ""}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
        placeholder="Digite sua resposta…"
      />
    );
  }

  return (
    <Input
      value={typeof value === "string" ? value : ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Digite sua resposta…"
    />
  );
};
