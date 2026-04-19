import { Suspense, Component, type ReactNode, type ErrorInfo } from 'react'
import { useStore } from '@/store/useStore'
import Scene from '@/components/canvas/Scene'
import StatusBar from '@/components/ui/StatusBar'
import DataPanel from '@/components/ui/DataPanel'
import AITerminal from '@/components/ui/AITerminal'
import AlertToast from '@/components/ui/AlertToast'

// ── 简单 ErrorBoundary，防止 3D 场景崩溃时白屏 ───────────────────────────────
class SceneErrorBoundary extends Component<
  { children: ReactNode },
  { error: string | null }
> {
  state = { error: null }

  static getDerivedStateFromError(e: Error) {
    return { error: e.message }
  }

  componentDidCatch(e: Error, info: ErrorInfo) {
    console.error('[SceneError]', e, info)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-surface text-center px-8">
          <div className="text-danger font-mono text-sm mb-2">Scene Error</div>
          <div className="text-slate-500 text-xs font-mono max-w-md break-all">
            {this.state.error}
          </div>
          <button
            className="mt-6 text-xs text-accent border border-accent/30 px-4 py-2 rounded hover:bg-accent/10 transition-colors"
            onClick={() => this.setState({ error: null })}
          >
            Retry
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

export default function App() {
  const isLoaded = useStore((s) => s.isLoaded)

  return (
    <div className="relative w-full h-full bg-surface overflow-hidden">
      {/* 3D 主场景（全屏 Canvas） */}
      <SceneErrorBoundary>
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </SceneErrorBoundary>

      {/* UI 覆盖层（叠加在 Canvas 上） */}
      {isLoaded && (
        <>
          <StatusBar />
          <AlertToast />
          <DataPanel />
          <AITerminal />
        </>
      )}
    </div>
  )
}
