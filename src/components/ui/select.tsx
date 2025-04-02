"use client"

import React, { useState, useRef, useEffect } from "react"
import { cn } from "@/lib/utils"
import { Check, ChevronDown } from "lucide-react"

// CUSTOM SELECT IMPLEMENTATION - NO RADIX UI
// This is a completely custom implementation to avoid the maximum update depth exceeded error

interface SelectProps {
  value?: string
  onValueChange?: (value: string) => void
  disabled?: boolean
  children: React.ReactNode
  placeholder?: string
  className?: string
}

// Helper function to extract text content from React nodes
const extractTextFromReactNode = (node: React.ReactNode): string => {
  if (typeof node === 'string') return node
  if (typeof node === 'number') return node.toString()
  if (Array.isArray(node)) return node.map(extractTextFromReactNode).join('')
  if (React.isValidElement(node)) {
    if (node.props.children) {
      return extractTextFromReactNode(node.props.children)
    }
    // Handle image alt text for network icons
    if (node.type === 'img' && node.props.alt) {
      return node.props.alt
    }
  }
  return ''
}

// Main Select component
const Select = ({ value, onValueChange, disabled, children, placeholder, className }: SelectProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedValue, setSelectedValue] = useState(value || "")
  const [selectedLabel, setSelectedLabel] = useState<string>(placeholder || "Select an option")
  const selectRef = useRef<HTMLDivElement>(null)

  // Keep track of whether the selectedLabel has been set from props
  const selectedLabelSetRef = useRef<boolean>(false)

  // Handle outside clicks to close the dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Update the selectedValue state when the value prop changes
  useEffect(() => {
    if (value !== undefined && value !== selectedValue) {
      setSelectedValue(value)

      // Skip updating the label if we've already set it once to avoid infinite loops
      if (!selectedLabelSetRef.current) {
        // Find the label for the selected value
        let found = false;

        // Store a stable reference to children to avoid dependency issues
        const childrenArray = React.Children.toArray(children);

        // Process children to find matching value
        childrenArray.forEach((child) => {
          if (React.isValidElement(child) && child.type === SelectContent) {
            React.Children.forEach(child.props.children, (contentChild) => {
              if (React.isValidElement(contentChild)) {
                // Handle items that might be wrapped in motion.div or other containers
                if (contentChild.props.children && Array.isArray(contentChild.props.children)) {
                  React.Children.forEach(contentChild.props.children, (nestedChild) => {
                    if (React.isValidElement(nestedChild) && nestedChild.type === SelectItem) {
                      if (nestedChild.props.value === value) {
                        // Extract text content from SelectItem
                        const extractedText = extractTextFromReactNode(nestedChild.props.children) || placeholder || "Select an option";
                        setSelectedLabel(extractedText);
                        found = true;
                        selectedLabelSetRef.current = true;
                      }
                    }
                  })
                } else if (React.isValidElement(contentChild) && contentChild.type === SelectItem) {
                  if (contentChild.props.value === value) {
                    // Extract text content from SelectItem
                    const extractedText = extractTextFromReactNode(contentChild.props.children) || placeholder || "Select an option";
                    setSelectedLabel(extractedText);
                    found = true;
                    selectedLabelSetRef.current = true;
                  }
                }
              }
            })
          }
        })

        // If no match found, reset to placeholder
        if (!found && placeholder) {
          setSelectedLabel(placeholder)
        }
      }
    }
  }, [value, placeholder, selectedValue])  // Add selectedValue, remove children from dependency array

  const handleItemClick = (itemValue: string, itemLabel: string) => {
    setSelectedValue(itemValue)
    setSelectedLabel(itemLabel)
    setIsOpen(false)
    if (onValueChange) {
      onValueChange(itemValue)
    }
  }

  // Handle toggle click
  const handleToggleClick = () => {
    if (!disabled) {
      setIsOpen(!isOpen)
    }
  };

  // Provide the context for child components
  const contextValue = {
    selectedValue,
    handleItemClick,
    extractTextFromReactNode,
  }

  return (
    <div
      ref={selectRef}
      className={cn("relative w-full", className)}
    >
      <div
        onClick={handleToggleClick}
        className={cn(
          "flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border bg-transparent px-3 py-2 text-sm transition-colors duration-200",
          disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:border-white/30",
          className
        )}
      >
        {React.Children.map(children, child => {
          if (React.isValidElement(child) && child.type === SelectTrigger) {
            return child.props.children
          }
        })}
        <ChevronDown
          className={`h-4 w-4 opacity-50 ml-1 flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : 'rotate-0'}`}
        />
      </div>

      {isOpen && (
        <div
          className="absolute z-[9999] top-full left-0 mt-1 rounded-md border border-white/20 bg-black/95 shadow-lg animate-in fade-in-80 slide-in-from-top-5"
          style={{
            width: selectRef.current?.offsetWidth || 'auto',
            maxHeight: '60vh',
            overflow: 'auto'
          }}
        >
          <SelectContext.Provider value={contextValue}>
            {children}
          </SelectContext.Provider>
        </div>
      )}
    </div>
  )
}

// Context to pass data to children
const SelectContext = React.createContext<{
  selectedValue: string
  handleItemClick: (value: string, label: string) => void
  extractTextFromReactNode: (node: React.ReactNode) => string
}>({
  selectedValue: "",
  handleItemClick: () => {},
  extractTextFromReactNode: () => "",
})

// Item component
interface SelectItemProps {
  value: string
  children: React.ReactNode
  className?: string
  disabled?: boolean
  showCheck?: boolean
}

const SelectItem = ({ value, children, className, disabled, showCheck = true }: SelectItemProps) => {
  const { selectedValue, handleItemClick, extractTextFromReactNode } = React.useContext(SelectContext)
  const isSelected = selectedValue === value
  const label = extractTextFromReactNode(children)

  return (
    <div
      onClick={() => !disabled && handleItemClick(value, label)}
      className={cn(
        "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none transition-colors duration-200",
        isSelected ? "bg-white/10 text-white" : "hover:bg-white/5",
        disabled ? "pointer-events-none opacity-50" : "cursor-pointer",
        className
      )}
    >
      {children}
      {isSelected && showCheck && (
        <span className="absolute right-2 flex h-3.5 w-3.5 items-center justify-center">
          <Check className="h-3.5 w-3.5 text-green-400" />
        </span>
      )}
    </div>
  )
}

// Group component
interface SelectGroupProps {
  children: React.ReactNode
  className?: string
}

const SelectGroup = ({ children, className }: SelectGroupProps) => {
  return (
    <div className={cn("px-1 py-1", className)}>
      {children}
    </div>
  )
}

// Label component
interface SelectLabelProps {
  children: React.ReactNode
  className?: string
}

const SelectLabel = ({ children, className }: SelectLabelProps) => {
  return (
    <div className={cn("px-2 py-1.5 text-sm font-semibold", className)}>
      {children}
    </div>
  )
}

// Separator component
const SelectSeparator = ({ className }: { className?: string }) => {
  return (
    <div className={cn("-mx-1 my-1 h-px bg-white/10", className)} />
  )
}

// Value component (just for API compatibility) - No actual rendering happens here
const SelectValue = ({ placeholder, children }: { placeholder?: string, children?: React.ReactNode }) => {
  return null;
}

// Trigger component (for API compatibility) - Now only serves as a marker for the trigger content
const SelectTrigger = ({ children, className }: { children: React.ReactNode, className?: string }) => {
  return <>{children}</>
}

// Content component (just for API compatibility)
const SelectContent = ({ children, className }: { children: React.ReactNode, className?: string }) => {
  return <>{children}</>
}

// Tooltip compatibility
const Tooltip = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>
}

const TooltipProvider = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>
}

const TooltipRoot = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>
}

const TooltipTrigger = ({ children, className }: { children: React.ReactNode, className?: string }) => {
  return <span className={className}>{children}</span>
}

const TooltipContent = ({ children, className }: { children: React.ReactNode, className?: string }) => {
  return <div className={cn("bg-black border border-white/20 p-2 rounded shadow-lg", className)}>{children}</div>
}

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  Tooltip,
  TooltipProvider,
  TooltipRoot,
  TooltipTrigger,
  TooltipContent
}
