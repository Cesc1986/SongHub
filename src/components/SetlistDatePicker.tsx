import { useState, useEffect } from 'react'
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Button,
  SimpleGrid,
  Text,
  Flex,
  IconButton,
  Box,
} from '@chakra-ui/react'
import { ChevronLeftIcon, ChevronRightIcon } from '@chakra-ui/icons'

interface Props {
  isOpen: boolean
  onClose: () => void
  onDateSelect: (date: string) => void
  selectedDate?: string
  existingDates: string[]
}

const WEEKDAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']
const MONTHS = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember']

export default function SetlistDatePicker({ isOpen, onClose, onDateSelect, selectedDate, existingDates }: Props): JSX.Element {
  const [viewDate, setViewDate] = useState(new Date())
  const existingSet = new Set(existingDates)

  useEffect(() => {
    if (isOpen) {
      // Always start with current month
      setViewDate(new Date())
    }
  }, [isOpen])

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()

  const firstDayOfMonth = new Date(year, month, 1)
  const lastDayOfMonth = new Date(year, month + 1, 0)
  
  let startDay = firstDayOfMonth.getDay() - 1
  if (startDay < 0) startDay = 6

  const daysInMonth = lastDayOfMonth.getDate()

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1))
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1))

  const handleDayClick = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    if (existingSet.has(dateStr)) {
      onDateSelect(dateStr)
    }
  }

  const today = new Date()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  const days = []
  for (let i = 0; i < startDay; i++) {
    days.push(<Box key={`empty-${i}`} />)
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    const isToday = dateStr === todayStr
    const isSelected = dateStr === selectedDate
    const hasSetlist = existingSet.has(dateStr)

    days.push(
      <Button
        key={day}
        size="sm"
        variant={hasSetlist ? 'solid' : 'ghost'}
        colorScheme={hasSetlist ? 'purple' : undefined}
        opacity={hasSetlist ? 1 : 0.3}
        onClick={() => handleDayClick(day)}
        fontWeight={isToday || hasSetlist ? 'bold' : 'normal'}
        bg={isToday && !hasSetlist ? 'gray.200' : undefined}
        border={isToday ? '3px solid' : undefined}
        borderColor={isToday ? 'gray.500' : undefined}
        _dark={{ 
          bg: isToday && !hasSetlist ? 'gray.600' : undefined,
          borderColor: isToday ? 'gray.300' : undefined 
        }}
        isDisabled={!hasSetlist}
        cursor={hasSetlist ? 'pointer' : 'default'}
      >
        {day}
      </Button>
    )
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm" isCentered>
      <ModalOverlay />
      <ModalContent>
        <ModalCloseButton />
        <ModalHeader pb={2} pt={4}>
          <Flex align="center" justify="center" gap={4}>
            <IconButton
              aria-label="Vorheriger Monat"
              icon={<ChevronLeftIcon />}
              size="sm"
              variant="ghost"
              onClick={prevMonth}
            />
            <Text fontSize="md" fontWeight="semibold" minW="140px" textAlign="center">
              {MONTHS[month]} {year}
            </Text>
            <IconButton
              aria-label="Nächster Monat"
              icon={<ChevronRightIcon />}
              size="sm"
              variant="ghost"
              onClick={nextMonth}
            />
          </Flex>
        </ModalHeader>
        <ModalBody pb={4}>
          <SimpleGrid columns={7} spacing={1} mb={2}>
            {WEEKDAYS.map(d => (
              <Text key={d} fontSize="xs" fontWeight="bold" textAlign="center" color="gray.500">
                {d}
              </Text>
            ))}
          </SimpleGrid>
          <SimpleGrid columns={7} spacing={1}>
            {days}
          </SimpleGrid>
          <Flex mt={3} gap={4} justify="center" fontSize="xs" color="gray.500">
            <Flex align="center" gap={1}>
              <Box w="12px" h="12px" borderRadius="sm" bg="purple.500" />
              <Text>Setlist vorhanden</Text>
            </Flex>
          </Flex>
        </ModalBody>
      </ModalContent>
    </Modal>
  )
}
