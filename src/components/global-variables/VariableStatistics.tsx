/**
 * VariableStatistics Component
 *
 * A comprehensive statistics display component for global variables
 * showing key metrics and insights with responsive design.
 */

import React from 'react';
import { TrendingUp, Database, Hash, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useGlobalVariablesStats } from '@/hooks/useGlobalVariables';

import VariableTypeChip from './VariableTypeChip';

interface VariableStatisticsProps {
  className?: string;
}

const VariableStatistics: React.FC<VariableStatisticsProps> = ({
  className = '',
}) => {
  const { data: statsData, isLoading, error } = useGlobalVariablesStats();

  if (isLoading) {
    return (
      <div
        className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-md ${className}`}
      >
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Alert className={className}>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load statistics. Please try refreshing the page.
        </AlertDescription>
      </Alert>
    );
  }

  const stats = statsData?.data;
  if (!stats) {
    return null;
  }

  return (
    <div
      className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-md ${className}`}
    >
      {/* Total Variables */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Variables</CardTitle>
          <Database className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalVariables}</div>
          <p className="text-xs text-muted-foreground">
            Active global variables
          </p>
        </CardContent>
      </Card>

      {/* Total Bot References */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Bot References</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalBotReferences}</div>
          <p className="text-xs text-muted-foreground">
            Total usage across bots
          </p>
        </CardContent>
      </Card>

      {/* Variable Types */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Variable Types</CardTitle>
          <Hash className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stats.variablesByType.length}
          </div>
          <div className="flex flex-wrap gap-1 mt-2">
            {stats.variablesByType.map((typeInfo) => (
              <div key={typeInfo.type} className="flex items-center gap-1">
                <VariableTypeChip type={typeInfo.type} size="sm" />
                <span className="text-xs text-muted-foreground">
                  {typeInfo.count}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Unused Variables */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Unused Variables
          </CardTitle>
          <AlertCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stats.unusedVariables.length}
          </div>
          <p className="text-xs text-muted-foreground">
            Variables not used by any bot
          </p>
        </CardContent>
      </Card>

      {/* Most Used Variables - Full Width */}
      {stats.mostUsedVariables.length > 0 && (
        <Card className="sm:col-span-2 lg:col-span-4">
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Most Used Variables
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-sm">
              {stats.mostUsedVariables.slice(0, 6).map((variable) => (
                <div
                  key={variable.id}
                  className="flex items-center justify-between p-sm rounded-lg border bg-muted/20"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm truncate font-mono">
                      {variable.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Used by {variable.botAmount} bot
                      {variable.botAmount !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <Badge variant="secondary" className="ml-2">
                    {variable.botAmount}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Unused Variables List - Full Width */}
      {stats.unusedVariables.length > 0 && (
        <Card className="sm:col-span-2 lg:col-span-4">
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-xs">
              <AlertCircle className="h-4 w-4 text-yellow-500" />
              Unused Variables
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert className="mb-4">
              <AlertDescription className="text-sm">
                These variables are not currently used by any bots. Consider
                removing them to keep your workspace clean.
              </AlertDescription>
            </Alert>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-xs">
              {stats.unusedVariables.slice(0, 9).map((variable) => (
                <div
                  key={variable.id}
                  className="flex items-center p-xs rounded-md border bg-yellow-50 border-yellow-200"
                >
                  <code className="font-mono text-sm text-yellow-800">
                    {variable.name}
                  </code>
                </div>
              ))}
              {stats.unusedVariables.length > 9 && (
                <div className="flex items-center p-xs rounded-md border bg-muted/20 text-muted-foreground">
                  <span className="text-sm">
                    +{stats.unusedVariables.length - 9} more
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default VariableStatistics;
