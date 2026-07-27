import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export type PageContentData = {
  [key: string]: any;
};

export function usePageContent(pageKey: string) {
  const [content, setContent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContent = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('page_contents')
          .select('content')
          .eq('page_key', pageKey)
          .single();

        if (error) {
          console.error('Sayfa içeriği yüklenirken hata:', error);
          setContent(null);
        } else {
          setContent(data?.content || null);
        }
      } catch (err) {
        console.error('Sayfa içeriği yüklenirken hata:', err);
        setContent(null);
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [pageKey]);

  return { content, loading };
}
