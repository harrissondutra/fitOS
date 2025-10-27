"use client";

import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";

interface Playlist {
  id: string;
  name: string;
  description: string;
  trackCount: number;
  spotifyUri: string;
  imageUrl?: string;
  owner: string;
}

export function useSpotify() {
  const [connected, setConnected] = useState(false);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(false);
  const [authUrl, setAuthUrl] = useState('');

  const fetchConnectionStatus = async () => {
    try {
      const response = await fetch('/api/music/connection-status');
      
      if (!response.ok) throw new Error('Failed to fetch connection status');
      
      const data = await response.json();
      
      if (data.success) {
        setConnected(data.data.connected);
      }
    } catch (error) {
      console.error('Error fetching connection status:', error);
    }
  };

  const fetchAuthUrl = async () => {
    try {
      const response = await fetch('/api/music/auth-url');
      
      if (!response.ok) throw new Error('Failed to get auth URL');
      
      const data = await response.json();
      
      if (data.success) {
        setAuthUrl(data.data.authUrl);
      }
    } catch (error) {
      console.error('Error fetching auth URL:', error);
    }
  };

  const connectSpotify = () => {
    if (authUrl) {
      window.location.href = authUrl;
    } else {
      toast.error('URL de autenticação não disponível');
    }
  };

  const disconnectSpotify = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/music/disconnect', {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to disconnect Spotify');

      const data = await response.json();
      
      if (data.success) {
        setConnected(false);
        setPlaylists([]);
        toast.success('Desconectado do Spotify');
      }
    } catch (error) {
      console.error('Error disconnecting Spotify:', error);
      toast.error('Erro ao desconectar Spotify');
    } finally {
      setLoading(false);
    }
  };

  const fetchPlaylists = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/music/playlists');
      
      if (!response.ok) throw new Error('Failed to fetch playlists');
      
      const data = await response.json();
      
      if (data.success) {
        setPlaylists(data.data);
      }
    } catch (error) {
      console.error('Error fetching playlists:', error);
      toast.error('Erro ao carregar playlists');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConnectionStatus();
    fetchAuthUrl();
  }, []);

  useEffect(() => {
    if (connected) {
      fetchPlaylists();
    }
  }, [connected]);

  return {
    connected,
    playlists,
    loading,
    authUrl,
    connectSpotify,
    disconnectSpotify,
    refetchPlaylists: fetchPlaylists
  };
}

