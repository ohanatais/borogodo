import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MirrorFeedback } from '../MirrorFeedback'

const mockSubmitFeedback = vi.fn()

vi.mock('@/app/[locale]/espelho/actions', () => ({
  submitMirrorFeedback: (...args: unknown[]) => mockSubmitFeedback(...args),
}))

describe('MirrorFeedback', () => {
  beforeEach(() => {
    mockSubmitFeedback.mockResolvedValue(undefined)
  })

  it('renders the feedback question with yes and no buttons', () => {
    render(<MirrorFeedback snapshotId="snap-1" initialResonated={null} />)

    expect(screen.getByText('feedback.question')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'feedback.yes' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'feedback.no' })).toBeInTheDocument()
  })

  it('calls submitMirrorFeedback with true when yes is clicked and shows confirmation', async () => {
    render(<MirrorFeedback snapshotId="snap-1" initialResonated={null} />)

    fireEvent.click(screen.getByRole('button', { name: 'feedback.yes' }))

    await waitFor(() => {
      expect(mockSubmitFeedback).toHaveBeenCalledWith('snap-1', true)
      expect(screen.getByText('feedback.confirmed')).toBeInTheDocument()
    })
  })

  it('calls submitMirrorFeedback with false when no is clicked and shows confirmation', async () => {
    render(<MirrorFeedback snapshotId="snap-1" initialResonated={null} />)

    fireEvent.click(screen.getByRole('button', { name: 'feedback.no' }))

    await waitFor(() => {
      expect(mockSubmitFeedback).toHaveBeenCalledWith('snap-1', false)
      expect(screen.getByText('feedback.confirmed')).toBeInTheDocument()
    })
  })

  it('renders confirmation state directly when initialResonated is not null', () => {
    render(<MirrorFeedback snapshotId="snap-1" initialResonated={true} />)

    expect(screen.getByText('feedback.confirmed')).toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})
