"use client";

import { useSpotify } from "@/hooks/use-spotify";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Music, Plug, Unplug, RefreshCw } from "lucide-react";
import { toast } from "react-hot-toast";

export default function MusicPage() {
  const { connected, playlists, loading, connectSpotify, disconnectSpotify, refetchPlaylists } = useSpotify();

  if (loading && !connected) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!connected) {
    return (
      <div className="container mx-auto p-6">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Conectar Spotify</CardTitle>
            <CardDescription>
              Conecte sua conta Spotify para usar suas playlists durante os treinos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-center p-12 bg-muted rounded-lg">
              <Music className="h-24 w-24 text-muted-foreground" />
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold">Benefícios de conectar:</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Use suas próprias playlists nos treinos</li>
                <li>Acesse playlists personalizadas</li>
                <li>Sincronize automaticamente</li>
                <li>Controle completo da sua música</li>
              </ul>
            </div>

            <Button onClick={connectSpotify} className="w-full" size="lg">
              <Plug className="mr-2 h-5 w-5" />
              Conectar com Spotify
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              Você será redirecionado para autorizar a conexão com sua conta Spotify
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Suas Playlists</h1>
          <p className="text-muted-foreground">Gerenciar suas playlists do Spotify</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="default" className="bg-green-600">
            ✓ Conectado
          </Badge>
          <Button variant="outline" onClick={disconnectSpotify} size="sm">
            <Unplug className="mr-2 h-4 w-4" />
            Desconectar
          </Button>
          <Button variant="outline" onClick={refetchPlaylists} size="sm" disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin" />
        </div>
      ) : playlists.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {playlists.map((playlist) => (
            <Card key={playlist.id} className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start gap-3">
                  {playlist.imageUrl ? (
                    <img
                      src={playlist.imageUrl}
                      alt={playlist.name}
                      className="w-16 h-16 rounded object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded bg-muted flex items-center justify-center">
                      <Music className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <CardTitle className="line-clamp-2">{playlist.name}</CardTitle>
                    <CardDescription className="line-clamp-2 mt-1">
                      {playlist.description || 'Sem descrição'}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {playlist.trackCount} músicas
                  </span>
                  <Badge variant="outline">{playlist.owner}</Badge>
                </div>
                
                <Button 
                  className="w-full mt-4" 
                  variant="outline"
                  onClick={() => window.open(playlist.spotifyUri, '_blank')}
                >
                  Abrir no Spotify
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Music className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-center text-muted-foreground">
              Você ainda não tem playlists públicas no Spotify
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

