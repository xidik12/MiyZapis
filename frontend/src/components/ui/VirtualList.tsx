import React, { forwardRef, CSSProperties } from 'react';
import { FixedSizeList, VariableSizeList, ListChildComponentProps } from 'react-window';

/**
 * Props for VirtualList component
 */
interface VirtualListProps<T> {
  /**
   * Array of items to render
   */
  items: T[];
  /**
   * Height of the list container in pixels
   */
  height: number;
  /**
   * Width of the list container (default: '100%')
   */
  width?: string | number;
  /**
   * Height of each item in pixels (for fixed-size lists)
   * If provided, uses FixedSizeList
   * If not provided, must provide getItemSize for VariableSizeList
   */
  itemSize?: number;
  /**
   * Function to get the size of each item (for variable-size lists)
   * Only used if itemSize is not provided
   */
  getItemSize?: (index: number) => number;
  /**
   * Render function for each item
   */
  renderItem: (item: T, index: number, style: CSSProperties) => React.ReactNode;
  /**
   * Additional class name for the list container
   */
  className?: string;
  /**
   * Number of items to render outside of the visible area (default: 3)
   * Helps with smooth scrolling
   */
  overscanCount?: number;
  /**
   * Callback when scroll position changes
   */
  onScroll?: (scrollOffset: number) => void;
  /**
   * Initial scroll offset
   */
  initialScrollOffset?: number;
}

/**
 * VirtualList component for rendering large lists efficiently
 *
 * Uses react-window to only render visible items, dramatically improving
 * performance for lists with hundreds or thousands of items.
 *
 * Automatically chooses between FixedSizeList and VariableSizeList based on props.
 *
 * @example
 * // Fixed-size items
 * <VirtualList
 *   items={services}
 *   height={600}
 *   itemSize={120}
 *   renderItem={(service, index, style) => (
 *     <div style={style} key={service.id}>
 *       <ServiceCard service={service} />
 *     </div>
 *   )}
 * />
 *
 * @example
 * // Variable-size items
 * <VirtualList
 *   items={bookings}
 *   height={600}
 *   getItemSize={(index) => bookings[index].expanded ? 200 : 100}
 *   renderItem={(booking, index, style) => (
 *     <div style={style} key={booking.id}>
 *       <BookingCard booking={booking} />
 *     </div>
 *   )}
 * />
 */
export const VirtualList = <T,>({
  items,
  height,
  width = '100%',
  itemSize,
  getItemSize,
  renderItem,
  className = '',
  overscanCount = 3,
  onScroll,
  initialScrollOffset = 0,
}: VirtualListProps<T>) => {
  // Wrapper component that connects react-window's props to our renderItem
  const Row = ({ index, style }: ListChildComponentProps) => {
    return <>{renderItem(items[index], index, style)}</>;
  };

  // Use FixedSizeList if itemSize is provided
  if (itemSize !== undefined) {
    return (
      <FixedSizeList
        height={height}
        width={width}
        itemCount={items.length}
        itemSize={itemSize}
        overscanCount={overscanCount}
        className={className}
        onScroll={({ scrollOffset }) => onScroll?.(scrollOffset)}
        initialScrollOffset={initialScrollOffset}
      >
        {Row}
      </FixedSizeList>
    );
  }

  // Use VariableSizeList if getItemSize is provided
  if (getItemSize) {
    return (
      <VariableSizeList
        height={height}
        width={width}
        itemCount={items.length}
        itemSize={getItemSize}
        overscanCount={overscanCount}
        className={className}
        onScroll={({ scrollOffset }) => onScroll?.(scrollOffset)}
        initialScrollOffset={initialScrollOffset}
      >
        {Row}
      </VariableSizeList>
    );
  }

  // Fallback: throw error if neither itemSize nor getItemSize is provided
  throw new Error(
    'VirtualList requires either itemSize (for fixed-size items) or getItemSize (for variable-size items)'
  );
};

/**
 * Props for InfiniteVirtualList component
 */
interface InfiniteVirtualListProps<T> extends VirtualListProps<T> {
  /**
   * Whether there are more items to load
   */
  hasMore: boolean;
  /**
   * Whether items are currently being loaded
   */
  isLoading: boolean;
  /**
   * Callback to load more items
   */
  onLoadMore: () => void;
  /**
   * Custom loading component
   */
  loadingComponent?: React.ReactNode;
  /**
   * Distance from bottom (in pixels) to trigger load more (default: 300)
   */
  loadMoreThreshold?: number;
}

/**
 * InfiniteVirtualList component for infinite scrolling with virtual rendering
 *
 * Combines virtual scrolling with infinite loading for optimal performance
 * with large datasets.
 *
 * @example
 * <InfiniteVirtualList
 *   items={services}
 *   height={600}
 *   itemSize={120}
 *   hasMore={hasMoreServices}
 *   isLoading={loading}
 *   onLoadMore={fetchMoreServices}
 *   renderItem={(service, index, style) => (
 *     <div style={style} key={service.id}>
 *       <ServiceCard service={service} />
 *     </div>
 *   )}
 * />
 */
export const InfiniteVirtualList = <T,>({
  hasMore,
  isLoading,
  onLoadMore,
  loadingComponent,
  loadMoreThreshold = 300,
  onScroll,
  height,
  ...virtualListProps
}: InfiniteVirtualListProps<T>) => {
  const handleScroll = (scrollOffset: number) => {
    onScroll?.(scrollOffset);

    // Calculate if we're near the bottom
    const scrollableHeight = height;
    const totalHeight = virtualListProps.itemSize
      ? virtualListProps.items.length * virtualListProps.itemSize
      : 0;

    const distanceFromBottom = totalHeight - (scrollOffset + scrollableHeight);

    // Trigger load more if near bottom
    if (
      hasMore &&
      !isLoading &&
      distanceFromBottom < loadMoreThreshold
    ) {
      onLoadMore();
    }
  };

  return (
    <div className="relative">
      <VirtualList
        {...virtualListProps}
        height={height}
        onScroll={handleScroll}
      />

      {/* Loading indicator at bottom */}
      {isLoading && (
        <div className="absolute bottom-0 left-0 right-0 p-4 flex justify-center">
          {loadingComponent || (
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
          )}
        </div>
      )}
    </div>
  );
};

/**
 * AutoSizer component wrapper for VirtualList
 * Automatically sizes the list to fit its container
 *
 * Note: This is a simple implementation. For more complex use cases,
 * consider using react-virtualized-auto-sizer package
 */
interface AutoSizedVirtualListProps<T> extends Omit<VirtualListProps<T>, 'height' | 'width'> {
  /**
   * Container className (should have defined height)
   */
  containerClassName?: string;
}

export const AutoSizedVirtualList = <T,>({
  containerClassName = '',
  ...props
}: AutoSizedVirtualListProps<T>) => {
  const [size, setSize] = React.useState({ width: 0, height: 0 });
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!containerRef.current) return;

    const updateSize = () => {
      if (containerRef.current) {
        setSize({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        });
      }
    };

    // Initial size
    updateSize();

    // Update on window resize
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  return (
    <div ref={containerRef} className={`w-full h-full ${containerClassName}`}>
      {size.height > 0 && (
        <VirtualList
          {...props}
          height={size.height}
          width={size.width}
        />
      )}
    </div>
  );
};

export default VirtualList;
