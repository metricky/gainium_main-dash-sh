/**
 * BotViewRedirect Component
 *
 * Handles redirecting from legacy bot routes (/{bot-type}/:id) to the new
 * view routes (/{bot-type}/view/:id).
 *
 * This component extracts the id parameter and redirects to the proper view route.
 */

import { Navigate, useLocation, useParams } from 'react-router-dom';

interface BotViewRedirectProps {
  basePath: string; // e.g., '/bot', '/combo', '/grid', '/hedge/bot', '/hedge/combo'
}

export const BotViewRedirect: React.FC<BotViewRedirectProps> = ({
  basePath,
}) => {
  const { id } = useParams<{ id: string }>();
  const { search, hash } = useLocation();

  if (!id) {
    return <Navigate to={`${basePath}${search}${hash}`} replace />;
  }

  // Preserve query string + hash so share links (?share=, ?backtestShare=)
  // survive the legacy → view-route redirect.
  return (
    <Navigate to={`${basePath}/view/${id}${search}${hash}`} replace />
  );
};

export default BotViewRedirect;
