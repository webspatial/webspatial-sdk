import React from 'react'
import {
  WRMStats,
  ResourceMetadata,
  ResourceState,
  ResourceType,
} from './types'

interface WRMDevPanelProps {
  stats: WRMStats
  resources: ResourceMetadata[]
  isOpen: boolean
  onClose: () => void
}

export const WRMDevPanel: React.FC<WRMDevPanelProps> = ({
  stats,
  resources,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null

  const getStateColor = (state: ResourceState) => {
    switch (state) {
      case ResourceState.NOT_LOADED:
        return 'text-gray-500'
      case ResourceState.LOADING:
        return 'text-blue-500'
      case ResourceState.READY:
        return 'text-green-500'
      case ResourceState.ATTACHED:
        return 'text-purple-500'
      case ResourceState.STALE:
        return 'text-yellow-500'
      case ResourceState.EVICTED:
        return 'text-red-500'
      default:
        return 'text-gray-500'
    }
  }

  const getTypeIcon = (type: ResourceType) => {
    switch (type) {
      case ResourceType.MODEL:
        return '🎯'
      case ResourceType.TEXTURE:
        return '🖼️'
      case ResourceType.MATERIAL:
        return '🎨'
      default:
        return '📦'
    }
  }

  return (
    <div className="fixed top-4 right-4 w-96 bg-white rounded-lg shadow-2xl border border-gray-200 z-50">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-800">WRM DevTools</h3>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 text-xl font-bold"
        >
          ×
        </button>
      </div>

      <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
        {/* Stats Overview */}
        <div className="bg-gray-50 rounded-lg p-3">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Overview</h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Resources:</span>
              <span className="font-mono">{stats.totalResources}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Memory Usage:</span>
              <span className="font-mono">
                {(stats.totalMemoryUsage / 1024 / 1024).toFixed(1)}MB
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Active Loads:</span>
              <span className="font-mono">{stats.activeLoadRequests}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Cache Hit Rate:</span>
              <span className="font-mono">
                {(stats.cacheHitRate * 100).toFixed(0)}%
              </span>
            </div>
          </div>
        </div>

        {/* State Distribution */}
        <div className="bg-gray-50 rounded-lg p-3">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">
            Resource States
          </h4>
          <div className="space-y-1">
            {Object.entries(stats.resourcesByState).map(
              ([state, count]) =>
                count > 0 && (
                  <div key={state} className="flex justify-between text-xs">
                    <span
                      className={`${getStateColor(state as ResourceState)} font-medium`}
                    >
                      {state}:
                    </span>
                    <span className="font-mono">{count}</span>
                  </div>
                ),
            )}
          </div>
        </div>

        {/* Type Distribution */}
        <div className="bg-gray-50 rounded-lg p-3">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">
            Resource Types
          </h4>
          <div className="space-y-1">
            {Object.entries(stats.resourcesByType).map(
              ([type, count]) =>
                count > 0 && (
                  <div key={type} className="flex justify-between text-xs">
                    <span className="text-gray-600">
                      {getTypeIcon(type as ResourceType)} {type}:
                    </span>
                    <span className="font-mono">{count}</span>
                  </div>
                ),
            )}
          </div>
        </div>

        {/* Resource List */}
        {resources.length > 0 && (
          <div className="bg-gray-50 rounded-lg p-3">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">
              Resources ({resources.length})
            </h4>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {resources.slice(0, 10).map(resource => (
                <div
                  key={resource.id}
                  className="flex justify-between items-center text-xs border-b border-gray-200 pb-1"
                >
                  <div className="flex items-center space-x-2">
                    <span>{getTypeIcon(resource.type)}</span>
                    <span className="font-mono text-gray-700 truncate max-w-32">
                      {resource.id}
                    </span>
                  </div>
                  <span
                    className={`${getStateColor(resource.state)} font-medium`}
                  >
                    {resource.state}
                  </span>
                </div>
              ))}
              {resources.length > 10 && (
                <div className="text-xs text-gray-500 text-center pt-1">
                  ... and {resources.length - 10} more
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

interface WRMDevToggleProps {
  isOpen: boolean
  onToggle: () => void
  stats: WRMStats
}

export const WRMDevToggle: React.FC<WRMDevToggleProps> = ({
  isOpen,
  onToggle,
  stats,
}) => {
  return (
    <button
      onClick={onToggle}
      className={`fixed top-4 right-4 z-40 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
        isOpen
          ? 'bg-blue-600 text-white'
          : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
      }`}
      title="Toggle WRM DevTools"
    >
      {isOpen ? '✕' : 'WRM'}
      {!isOpen && stats.activeLoadRequests > 0 && (
        <span className="ml-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">
          {stats.activeLoadRequests}
        </span>
      )}
    </button>
  )
}
