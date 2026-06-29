import React, { useEffect, useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { serviceService } from '@/services/service.service';
import { PageLoader } from '@/components/ui';

/**
 * Shareable service URL (/service/:id). The branded OG card is injected server-side
 * by the prerender so the link unfurls nicely on any platform; a human who clicks
 * through is sent to the specialist's profile page, where they can book the service.
 */
const ServicePublicPage: React.FC = () => {
  const { serviceId } = useParams();
  const [to, setTo] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const s: any = await serviceService.getService(serviceId as string);
        const specialistId = s?.specialist?.id;
        if (alive) setTo(specialistId ? `/specialist/${specialistId}?service=${serviceId}` : '/search');
      } catch {
        if (alive) setTo('/search');
      }
    })();
    return () => { alive = false; };
  }, [serviceId]);

  if (!to) return <PageLoader />;
  return <Navigate to={to} replace />;
};

export default ServicePublicPage;
