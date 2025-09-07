import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import RichTextEditor from "@/components/ui/rich-text-editor";
import type { Forum } from "@shared/schema";

interface PostCreateModalProps {
  onClose: () => void;
  forums: Forum[];
  selectedForumId?: string;
}

export default function PostCreateModal({ onClose, forums, selectedForumId }: PostCreateModalProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [forumId, setForumId] = useState(selectedForumId || "");
  const [attachments, setAttachments] = useState<FileList | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createPostMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      await apiRequest("POST", "/api/posts", formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/forums"] });
      toast({
        title: "Sucesso",
        description: "Tópico criado com sucesso!",
      });
      onClose();
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Não autorizado",
          description: "Você foi desconectado. Fazendo login novamente...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Erro",
        description: "Falha ao criar tópico. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !content.trim() || !forumId) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.append("title", title.trim());
    formData.append("content", content);
    formData.append("forumId", forumId);

    if (attachments) {
      for (let i = 0; i < attachments.length; i++) {
        formData.append("attachments", attachments[i]);
      }
    }

    createPostMutation.mutate(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Criar Novo Tópico</CardTitle>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClose}
              data-testid="button-close-modal"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="forum">Fórum *</Label>
              <Select value={forumId} onValueChange={setForumId} required>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um fórum" />
                </SelectTrigger>
                <SelectContent>
                  {forums.map((forum) => (
                    <SelectItem key={forum.id} value={forum.id}>
                      {forum.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Digite o título do tópico"
                required
                data-testid="input-post-title"
              />
            </div>

            <div>
              <Label htmlFor="content">Conteúdo *</Label>
              <RichTextEditor
                value={content}
                onChange={setContent}
                placeholder="Digite o conteúdo do tópico..."
              />
            </div>

            <div>
              <Label htmlFor="attachments">Anexar Imagens</Label>
              <Input
                id="attachments"
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => setAttachments(e.target.files)}
                data-testid="input-attachments"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Você pode anexar até 5 imagens (máximo 10MB cada)
              </p>
            </div>

            <div className="flex gap-3">
              <Button 
                type="submit" 
                className="bg-gradient-to-r from-purple-500 to-purple-700 hover:from-purple-600 hover:to-purple-800"
                disabled={createPostMutation.isPending}
                data-testid="button-create-post"
              >
                {createPostMutation.isPending ? "Criando..." : "Criar Tópico"}
              </Button>
              <Button 
                type="button" 
                variant="secondary" 
                onClick={onClose}
                data-testid="button-cancel"
              >
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
