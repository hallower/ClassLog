"use client";

import { useEffect, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Plus, Trash2, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getDB } from "@/lib/db";
import {
  createTemplate,
  deleteTemplate,
  ensureDefaultTemplates,
  updateTemplate,
} from "@/lib/repositories/notifications";

export function TemplateEditor() {
  const templates = useLiveQuery(async () => {
    await ensureDefaultTemplates();
    const arr = await getDB().messageTemplates.toArray();
    return arr.sort((a, b) => a.name.localeCompare(b.name, "ko"));
  }, []);
  const [editing, setEditing] = useState<Record<string, { name: string; body: string }>>({});

  useEffect(() => {
    if (!templates) return;
    setEditing((prev) => {
      const next = { ...prev };
      for (const t of templates) {
        if (!next[t.id]) next[t.id] = { name: t.name, body: t.body };
      }
      return next;
    });
  }, [templates]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          치환자: {"{학생}, {학부모}, {과제}, {시간}"}
        </p>
        <Button
          size="sm"
          variant="outline"
          onClick={async () => {
            const t = await createTemplate({ name: "새 템플릿", body: "" });
            setEditing((prev) => ({ ...prev, [t.id]: { name: t.name, body: t.body } }));
          }}
        >
          <Plus className="size-4" /> 새 템플릿
        </Button>
      </div>

      {templates === undefined ? (
        <div className="h-32 rounded-md bg-muted animate-pulse" />
      ) : (
        <div className="space-y-3">
          {templates.map((t) => {
            const draft = editing[t.id] ?? { name: t.name, body: t.body };
            const dirty = draft.name !== t.name || draft.body !== t.body;
            return (
              <Card key={t.id}>
                <CardContent className="p-4 space-y-2">
                  <div className="flex gap-2">
                    <Input
                      value={draft.name}
                      onChange={(e) =>
                        setEditing((prev) => ({
                          ...prev,
                          [t.id]: { ...draft, name: e.target.value },
                        }))
                      }
                    />
                    <Button
                      size="sm"
                      disabled={!dirty}
                      onClick={async () => {
                        try {
                          await updateTemplate(t.id, { name: draft.name, body: draft.body });
                          toast.success("저장되었습니다.");
                        } catch (err) {
                          console.error(err);
                          toast.error("저장 실패");
                        }
                      }}
                    >
                      <Save className="size-4" /> 저장
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={async () => {
                        if (!confirm(`${t.name} 템플릿을 삭제할까요?`)) return;
                        try {
                          await deleteTemplate(t.id);
                          toast.success("삭제되었습니다.");
                        } catch (err) {
                          console.error(err);
                          toast.error("삭제 실패");
                        }
                      }}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                  <Textarea
                    rows={4}
                    value={draft.body}
                    onChange={(e) =>
                      setEditing((prev) => ({
                        ...prev,
                        [t.id]: { ...draft, body: e.target.value },
                      }))
                    }
                  />
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
