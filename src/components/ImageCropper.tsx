import { useRef, useEffect, useState } from 'react'
import { Box, Button, Stack, Flex } from '@chakra-ui/react'
import { FiX } from 'react-icons/fi'

interface Props {
  imageSrc: string
  onCropComplete: (croppedBase64: string, mimeType: string) => void
  onCancel: () => void
}

interface CropArea {
  x: number
  y: number
  width: number
  height: number
}

type DragHandle = 'move' | 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'e' | 'w' | null

export default function ImageCropper({ imageSrc, onCropComplete, onCancel }: Props): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [image, setImage] = useState<HTMLImageElement | null>(null)
  const [crop, setCrop] = useState<CropArea>({ x: 0, y: 0, width: 0, height: 0 })
  const [zoom, setZoom] = useState(1) // 1 = 100%, 1.5 = 150%
  const [baseScale, setBaseScale] = useState(1)
  const [dragHandle, setDragHandle] = useState<DragHandle>(null)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, crop: { x: 0, y: 0, width: 0, height: 0 } })
  const [isDraggingCrop, setIsDraggingCrop] = useState(false)

  const HANDLE_SIZE = 14
  const MIN_SIZE = 50

  // Load image
  useEffect(() => {
    const img = new Image()
    img.onload = () => {
      setImage(img)
      setCrop({
        x: 0,
        y: 0,
        width: img.width,
        height: img.height,
      })
    }
    img.src = imageSrc
  }, [imageSrc])

  // Calculate baseScale
  useEffect(() => {
    if (!scrollContainerRef.current || !image) return
    const containerWidth = scrollContainerRef.current.clientWidth - 20
    const containerHeight = Math.min(window.innerHeight * 0.65, 600)
    const scaleX = containerWidth / image.width
    const scaleY = containerHeight / image.height
    setBaseScale(Math.min(scaleX, scaleY, 1))
  }, [image])

  // Redraw canvas
  useEffect(() => {
    if (!canvasRef.current || !image || baseScale === 0) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const displayScale = baseScale * zoom
    const displayWidth = image.width * displayScale
    const displayHeight = image.height * displayScale

    canvas.width = displayWidth
    canvas.height = displayHeight

    // Draw full image
    ctx.drawImage(image, 0, 0, displayWidth, displayHeight)

    // Draw dark overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
    ctx.fillRect(0, 0, displayWidth, displayHeight)

    // Clear and redraw crop area
    const sx = crop.x * displayScale
    const sy = crop.y * displayScale
    const sw = crop.width * displayScale
    const sh = crop.height * displayScale

    ctx.clearRect(sx, sy, sw, sh)
    ctx.drawImage(
      image,
      crop.x, crop.y, crop.width, crop.height,
      sx, sy, sw, sh
    )

    // Draw border
    ctx.strokeStyle = '#3182CE'
    ctx.lineWidth = 3
    ctx.strokeRect(sx, sy, sw, sh)

    // Draw corner handles
    ctx.fillStyle = '#FFFFFF'
    ctx.strokeStyle = '#3182CE'
    ctx.lineWidth = 2
    const handles = [
      [sx - HANDLE_SIZE/2, sy - HANDLE_SIZE/2],
      [sx + sw - HANDLE_SIZE/2, sy - HANDLE_SIZE/2],
      [sx - HANDLE_SIZE/2, sy + sh - HANDLE_SIZE/2],
      [sx + sw - HANDLE_SIZE/2, sy + sh - HANDLE_SIZE/2],
    ]
    handles.forEach(([hx, hy]) => {
      ctx.fillRect(hx, hy, HANDLE_SIZE, HANDLE_SIZE)
      ctx.strokeRect(hx, hy, HANDLE_SIZE, HANDLE_SIZE)
    })
  }, [image, crop, zoom, baseScale])

  const getHandleAtPoint = (x: number, y: number): DragHandle => {
    if (!image) return null
    const displayScale = baseScale * zoom
    const sx = crop.x * displayScale
    const sy = crop.y * displayScale
    const sw = crop.width * displayScale
    const sh = crop.height * displayScale

    const d = HANDLE_SIZE * 1.5
    if (Math.abs(x - sx) < d && Math.abs(y - sy) < d) return 'nw'
    if (Math.abs(x - (sx + sw)) < d && Math.abs(y - sy) < d) return 'ne'
    if (Math.abs(x - sx) < d && Math.abs(y - (sy + sh)) < d) return 'sw'
    if (Math.abs(x - (sx + sw)) < d && Math.abs(y - (sy + sh)) < d) return 'se'
    if (Math.abs(x - sx) < d) return 'w'
    if (Math.abs(x - (sx + sw)) < d) return 'e'
    if (Math.abs(y - sy) < d) return 'n'
    if (Math.abs(y - (sy + sh)) < d) return 's'
    if (x > sx && x < sx + sw && y > sy && y < sy + sh) return 'move'
    return null
  }

  const getEventCoords = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    const clientX = 'touches' in e ? e.touches[0]?.clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0]?.clientY : e.clientY
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    }
  }

  const handleCanvasClick = (e: React.MouseEvent | React.TouchEvent) => {
    // Ignore clicks if we were dragging
    if (isDraggingCrop) {
      setIsDraggingCrop(false)
      return
    }

    const coords = getEventCoords(e)
    const handle = getHandleAtPoint(coords.x, coords.y)
    
    // Only zoom if clicking outside crop handles
    if (!handle && scrollContainerRef.current) {
      const newZoom = zoom === 1 ? 1.5 : 1
      
      // Calculate scroll position to center on click point
      if (newZoom > 1) {
        const container = scrollContainerRef.current
        const canvas = canvasRef.current
        if (canvas) {
          const rect = canvas.getBoundingClientRect()
          const containerRect = container.getBoundingClientRect()
          
          // Click position relative to canvas
          const clickX = coords.x
          const clickY = coords.y
          
          // After zoom, scroll to keep click point centered
          setTimeout(() => {
            const newClickX = clickX * (newZoom / zoom)
            const newClickY = clickY * (newZoom / zoom)
            container.scrollLeft = newClickX - containerRect.width / 2
            container.scrollTop = newClickY - containerRect.height / 2
          }, 10)
        }
      }
      
      setZoom(newZoom)
    }
  }

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    const coords = getEventCoords(e)
    const handle = getHandleAtPoint(coords.x, coords.y)
    if (handle) {
      e.preventDefault()
      setDragHandle(handle)
      setDragStart({ x: coords.x, y: coords.y, crop: { ...crop } })
      setIsDraggingCrop(false)
    }
  }

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!dragHandle || !image) return
    e.preventDefault()
    setIsDraggingCrop(true)
    
    const coords = getEventCoords(e)
    const displayScale = baseScale * zoom
    const dx = (coords.x - dragStart.x) / displayScale
    const dy = (coords.y - dragStart.y) / displayScale
    const startCrop = dragStart.crop

    let newCrop = { ...crop }

    if (dragHandle === 'move') {
      newCrop.x = Math.max(0, Math.min(startCrop.x + dx, image.width - startCrop.width))
      newCrop.y = Math.max(0, Math.min(startCrop.y + dy, image.height - startCrop.height))
    } else if (dragHandle === 'nw') {
      newCrop.x = Math.max(0, Math.min(startCrop.x + dx, startCrop.x + startCrop.width - MIN_SIZE))
      newCrop.y = Math.max(0, Math.min(startCrop.y + dy, startCrop.y + startCrop.height - MIN_SIZE))
      newCrop.width = startCrop.width - (newCrop.x - startCrop.x)
      newCrop.height = startCrop.height - (newCrop.y - startCrop.y)
    } else if (dragHandle === 'ne') {
      newCrop.y = Math.max(0, Math.min(startCrop.y + dy, startCrop.y + startCrop.height - MIN_SIZE))
      newCrop.width = Math.max(MIN_SIZE, Math.min(startCrop.width + dx, image.width - startCrop.x))
      newCrop.height = startCrop.height - (newCrop.y - startCrop.y)
    } else if (dragHandle === 'sw') {
      newCrop.x = Math.max(0, Math.min(startCrop.x + dx, startCrop.x + startCrop.width - MIN_SIZE))
      newCrop.width = startCrop.width - (newCrop.x - startCrop.x)
      newCrop.height = Math.max(MIN_SIZE, Math.min(startCrop.height + dy, image.height - startCrop.y))
    } else if (dragHandle === 'se') {
      newCrop.width = Math.max(MIN_SIZE, Math.min(startCrop.width + dx, image.width - startCrop.x))
      newCrop.height = Math.max(MIN_SIZE, Math.min(startCrop.height + dy, image.height - startCrop.y))
    } else if (dragHandle === 'n') {
      newCrop.y = Math.max(0, Math.min(startCrop.y + dy, startCrop.y + startCrop.height - MIN_SIZE))
      newCrop.height = startCrop.height - (newCrop.y - startCrop.y)
    } else if (dragHandle === 's') {
      newCrop.height = Math.max(MIN_SIZE, Math.min(startCrop.height + dy, image.height - startCrop.y))
    } else if (dragHandle === 'w') {
      newCrop.x = Math.max(0, Math.min(startCrop.x + dx, startCrop.x + startCrop.width - MIN_SIZE))
      newCrop.width = startCrop.width - (newCrop.x - startCrop.x)
    } else if (dragHandle === 'e') {
      newCrop.width = Math.max(MIN_SIZE, Math.min(startCrop.width + dx, image.width - startCrop.x))
    }

    setCrop(newCrop)
  }

  const handleEnd = () => {
    setDragHandle(null)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (dragHandle) {
      handleMove(e)
    } else {
      const coords = getEventCoords(e)
      const handle = getHandleAtPoint(coords.x, coords.y)
      if (canvasRef.current) {
        canvasRef.current.style.cursor = handle ? 'move' : 'zoom-in'
      }
    }
  }

  const handleSave = () => {
    if (!image || !canvasRef.current) return

    const tempCanvas = document.createElement('canvas')
    tempCanvas.width = crop.width
    tempCanvas.height = crop.height
    const ctx = tempCanvas.getContext('2d')
    if (!ctx) return

    ctx.drawImage(
      image,
      crop.x, crop.y, crop.width, crop.height,
      0, 0, crop.width, crop.height
    )

    const base64 = tempCanvas.toDataURL('image/jpeg', 0.9)
    const base64Data = base64.split(',')[1]
    onCropComplete(base64Data, 'image/jpeg')
  }

  return (
    <Stack spacing={3}>
      {/* Top bar - nur Zurück-Button */}
      <Flex justify="flex-end">
        <Button
          leftIcon={<FiX />}
          size="sm"
          variant="ghost"
          onClick={onCancel}
        >
          Zurück
        </Button>
      </Flex>

      {/* Scrollable canvas */}
      <Box
        ref={scrollContainerRef}
        maxH="70vh"
        overflow="auto"
        border="1px solid"
        borderColor="gray.300"
        borderRadius="md"
        bg="gray.50"
        _dark={{ bg: 'gray.800' }}
        display="flex"
        justifyContent="center"
        alignItems="flex-start"
        p={2}
      >
        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          onMouseDown={handleStart}
          onMouseMove={handleMouseMove}
          onMouseUp={handleEnd}
          onMouseLeave={handleEnd}
          onTouchStart={handleStart}
          onTouchMove={handleMove}
          onTouchEnd={handleEnd}
          style={{ display: 'block', touchAction: 'none', cursor: 'zoom-in' }}
        />
      </Box>

      {/* Save button */}
      <Button colorScheme="blue" size="lg" onClick={handleSave}>
        Ausschnitt übernehmen
      </Button>
    </Stack>
  )
}
