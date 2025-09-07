import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import type { ForumWithStats } from "@shared/schema";

interface ForumCardProps {
  forum: ForumWithStats;
}

export default function ForumCard({ forum }: ForumCardProps) {
  return (
    <Link href={`/forum/${forum.slug}`}>
      <Card className="cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:shadow-purple-500/20">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div 
              className="w-12 h-12 rounded-lg flex items-center justify-center text-white text-lg"
              style={{ backgroundColor: forum.color }}
            >
              <i className={forum.icon}></i>
            </div>
            <div className="flex-1">
              <h4 className="text-lg font-semibold text-foreground mb-2 hover:text-purple-500 transition-colors">
                {forum.name}
              </h4>
              {forum.description && (
                <p className="text-muted-foreground text-sm mb-4">
                  {forum.description}
                </p>
              )}
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>
                  <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  {forum.postCount} posts
                </span>
                <span>
                  <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  {forum.viewCount} views
                </span>
                <span>
                  <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Criado em {forum.createdAt ? new Date(forum.createdAt).toLocaleDateString('pt-BR') : 'Data desconhecida'}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
