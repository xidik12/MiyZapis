# Performance Optimization & Implementation Guidelines

## 1. Core Web Vitals Optimization

### Largest Contentful Paint (LCP) - Target: <2.5s

**Critical Optimizations:**

```javascript
// Image optimization with next/image or similar
const OptimizedImage = ({ src, alt, width, height, priority = false }) => {
  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      priority={priority} // For above-the-fold images
      placeholder="blur"
      blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ..." // Low-quality placeholder
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      loading={priority ? "eager" : "lazy"}
    />
  );
};

// Hero section optimization
const HeroSection = () => {
  return (
    <section className="hero">
      {/* Preload critical hero image */}
      <link
        rel="preload"
        as="image"
        href="/hero-image-desktop.webp"
        media="(min-width: 768px)"
      />
      <link
        rel="preload"
        as="image"
        href="/hero-image-mobile.webp"
        media="(max-width: 767px)"
      />
      
      <OptimizedImage
        src="/hero-image.webp"
        alt="Professional service specialists ready to help"
        width={1200}
        height={600}
        priority={true}
      />
      
      <div className="hero-content">
        <h1>Find Your Perfect Service Professional</h1>
        <SearchForm />
      </div>
    </section>
  );
};
```

**Resource Prioritization:**
```html
<!-- Critical resource hints -->
<head>
  <!-- Preconnect to external domains -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="preconnect" href="https://api.bookingplatform.com">
  <link rel="preconnect" href="https://cdn.bookingplatform.com">
  
  <!-- Preload critical fonts -->
  <link rel="preload" href="/fonts/inter-var.woff2" as="font" type="font/woff2" crossorigin>
  
  <!-- Preload critical CSS -->
  <link rel="preload" href="/css/critical.css" as="style">
  <link rel="stylesheet" href="/css/critical.css">
  
  <!-- Preload above-the-fold images -->
  <link rel="preload" href="/hero-background.webp" as="image">
  
  <!-- DNS prefetch for third-party resources -->
  <link rel="dns-prefetch" href="https://www.google-analytics.com">
  <link rel="dns-prefetch" href="https://js.stripe.com">
</head>
```

### First Input Delay (FID) - Target: <100ms

**JavaScript Optimization:**

```javascript
// Code splitting with React.lazy and dynamic imports
import { lazy, Suspense } from 'react';

// Lazy load non-critical components
const BookingModal = lazy(() => import('./components/BookingModal'));
const SpecialistDashboard = lazy(() => import('./pages/SpecialistDashboard'));
const PaymentForm = lazy(() => import('./components/PaymentForm'));

// Route-based code splitting
const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route 
          path="/booking/*" 
          element={
            <Suspense fallback={<LoadingSpinner />}>
              <BookingFlow />
            </Suspense>
          } 
        />
        <Route 
          path="/dashboard" 
          element={
            <Suspense fallback={<DashboardSkeleton />}>
              <SpecialistDashboard />
            </Suspense>
          } 
        />
      </Routes>
    </Router>
  );
};

// Debounced search to reduce API calls
import { useMemo, useCallback } from 'react';
import { debounce } from 'lodash';

const SearchComponent = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);

  const debouncedSearch = useMemo(
    () => debounce(async (searchQuery) => {
      if (searchQuery.length > 2) {
        const results = await searchAPI(searchQuery);
        setResults(results);
      }
    }, 300),
    []
  );

  const handleInputChange = useCallback((e) => {
    const value = e.target.value;
    setQuery(value);
    debouncedSearch(value);
  }, [debouncedSearch]);

  return (
    <input
      type="text"
      value={query}
      onChange={handleInputChange}
      placeholder="Search for services..."
    />
  );
};

// Web Worker for heavy computations
// worker.js
self.onmessage = function(e) {
  const { specialists, filters } = e.data;
  
  // Heavy filtering/sorting logic
  const filtered = specialists.filter(specialist => {
    return specialist.rating >= filters.minRating &&
           specialist.price >= filters.minPrice &&
           specialist.price <= filters.maxPrice;
  });
  
  const sorted = filtered.sort((a, b) => {
    if (filters.sortBy === 'rating') return b.rating - a.rating;
    if (filters.sortBy === 'price') return a.price - b.price;
    return 0;
  });
  
  self.postMessage(sorted);
};

// Main thread usage
const useFilteredSpecialists = (specialists, filters) => {
  const [filteredResults, setFilteredResults] = useState([]);
  
  useEffect(() => {
    if (!specialists.length) return;
    
    const worker = new Worker('/worker.js');
    worker.postMessage({ specialists, filters });
    
    worker.onmessage = (e) => {
      setFilteredResults(e.data);
    };
    
    return () => worker.terminate();
  }, [specialists, filters]);
  
  return filteredResults;
};
```

### Cumulative Layout Shift (CLS) - Target: <0.1

**Layout Stability:**

```css
/* Reserve space for images to prevent layout shift */
.image-container {
  aspect-ratio: 16 / 9;
  background: var(--gray-100);
  display: flex;
  align-items: center;
  justify-content: center;
}

.image-container img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* Skeleton loaders with exact dimensions */
.specialist-card-skeleton {
  width: 100%;
  height: 320px; /* Match actual card height */
  background: white;
  border-radius: 0.5rem;
  padding: 1rem;
  border: 1px solid var(--gray-200);
}

.skeleton-avatar {
  width: 4rem;
  height: 4rem;
  border-radius: 50%;
  background: var(--gray-200);
  margin-bottom: 1rem;
}

.skeleton-text {
  height: 1rem;
  background: var(--gray-200);
  border-radius: 0.25rem;
  margin-bottom: 0.5rem;
}

.skeleton-text:nth-child(2) { width: 80%; }
.skeleton-text:nth-child(3) { width: 60%; }
.skeleton-text:nth-child(4) { width: 90%; }

/* Font loading optimization */
@font-face {
  font-family: 'Inter';
  src: url('/fonts/inter-var.woff2') format('woff2');
  font-weight: 100 900;
  font-display: swap; /* Prevents invisible text during font load */
}

/* Critical CSS inlined, non-critical loaded asynchronously */
.above-the-fold {
  /* All styles for visible content */
}

/* Reserve space for dynamic content */
.dynamic-content {
  min-height: 200px; /* Prevent layout shift when content loads */
}

.loading-placeholder {
  height: 200px;
  background: var(--gray-50);
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
}
```

## 2. Image & Media Optimization

### Modern Image Formats & Responsive Images

```javascript
// Next.js Image component configuration
const imageConfig = {
  domains: ['cdn.bookingplatform.com'],
  formats: ['image/webp', 'image/avif'],
  deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
  imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  minimumCacheTTL: 60 * 60 * 24 * 365, // 1 year
};

// Responsive image component
const ResponsiveImage = ({ 
  src, 
  alt, 
  sizes = "100vw",
  quality = 85,
  ...props 
}) => {
  return (
    <picture>
      <source
        srcSet={`
          ${generateWebPUrl(src, 400)} 400w,
          ${generateWebPUrl(src, 800)} 800w,
          ${generateWebPUrl(src, 1200)} 1200w
        `}
        sizes={sizes}
        type="image/webp"
      />
      <source
        srcSet={`
          ${generateJPEGUrl(src, 400)} 400w,
          ${generateJPEGUrl(src, 800)} 800w,
          ${generateJPEGUrl(src, 1200)} 1200w
        `}
        sizes={sizes}
        type="image/jpeg"
      />
      <img
        src={generateJPEGUrl(src, 800)}
        alt={alt}
        loading="lazy"
        decoding="async"
        {...props}
      />
    </picture>
  );
};

// Intersection Observer for lazy loading
const useLazyLoading = () => {
  useEffect(() => {
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.classList.remove('lazy');
          imageObserver.unobserve(img);
        }
      });
    });

    const lazyImages = document.querySelectorAll('img[data-src]');
    lazyImages.forEach(img => imageObserver.observe(img));

    return () => imageObserver.disconnect();
  }, []);
};

// Progressive image loading
const ProgressiveImage = ({ src, placeholder, alt }) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  return (
    <div className="progressive-image">
      <img
        src={placeholder}
        alt=""
        className={`placeholder ${loaded ? 'loaded' : ''}`}
        aria-hidden="true"
      />
      <img
        src={src}
        alt={alt}
        className={`main-image ${loaded ? 'loaded' : ''}`}
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
        loading="lazy"
      />
      {error && (
        <div className="error-placeholder">
          Failed to load image
        </div>
      )}
    </div>
  );
};
```

### Image Optimization CSS

```css
/* Progressive image loading styles */
.progressive-image {
  position: relative;
  overflow: hidden;
  background: var(--gray-100);
}

.progressive-image .placeholder {
  filter: blur(5px);
  transform: scale(1.1);
  transition: opacity 0.3s ease;
}

.progressive-image .placeholder.loaded {
  opacity: 0;
}

.progressive-image .main-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.progressive-image .main-image.loaded {
  opacity: 1;
}

/* Lazy loading styles */
.lazy {
  opacity: 0;
  transition: opacity 0.3s;
}

.lazy.loaded {
  opacity: 1;
}

/* Image optimization for different contexts */
.specialist-avatar {
  width: 4rem;
  height: 4rem;
  border-radius: 50%;
  object-fit: cover;
  background: var(--gray-200);
}

.portfolio-image {
  aspect-ratio: 1 / 1;
  object-fit: cover;
  border-radius: 0.5rem;
  background: var(--gray-100);
}

.hero-image {
  width: 100%;
  height: 60vh;
  object-fit: cover;
  object-position: center;
}

/* WebP fallback handling */
.webp .hero-image {
  background-image: url('/hero.webp');
}

.no-webp .hero-image {
  background-image: url('/hero.jpg');
}
```

## 3. Bundle Optimization & Code Splitting

### Webpack Bundle Analysis

```javascript
// webpack.config.js optimizations
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

module.exports = {
  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
          priority: 10,
        },
        common: {
          name: 'common',
          minChunks: 2,
          chunks: 'all',
          priority: 5,
          reuseExistingChunk: true,
        },
        react: {
          test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
          name: 'react',
          chunks: 'all',
          priority: 20,
        },
      },
    },
    runtimeChunk: {
      name: 'runtime',
    },
  },
  
  plugins: [
    // Bundle analyzer for production builds
    process.env.ANALYZE && new BundleAnalyzerPlugin(),
  ].filter(Boolean),
};

// Dynamic imports for route-based splitting
const routes = [
  {
    path: '/',
    component: lazy(() => import('../pages/HomePage')),
  },
  {
    path: '/search',
    component: lazy(() => import('../pages/SearchPage')),
  },
  {
    path: '/specialist/:id',
    component: lazy(() => import('../pages/SpecialistProfile')),
  },
  {
    path: '/booking',
    component: lazy(() => import('../pages/BookingFlow')),
  },
  {
    path: '/dashboard',
    component: lazy(() => import('../pages/Dashboard')),
  },
];

// Component-level code splitting
const BookingModal = lazy(() => 
  import('../components/BookingModal').then(module => ({
    default: module.BookingModal
  }))
);

const PaymentForm = lazy(() => 
  import('../components/PaymentForm').then(module => ({
    default: module.PaymentForm
  }))
);

// Feature-based splitting
const AdvancedFilters = lazy(() => 
  import('../features/search/AdvancedFilters')
);

const AnalyticsDashboard = lazy(() => 
  import('../features/analytics/Dashboard')
);
```

### Tree Shaking Optimization

```javascript
// Optimize imports to enable tree shaking
// Bad - imports entire library
import * as _ from 'lodash';
import moment from 'moment';

// Good - import only what you need
import { debounce, throttle } from 'lodash';
import { format, parseISO } from 'date-fns';

// Utility functions with tree shaking support
// utils/index.js
export { default as debounce } from './debounce';
export { default as formatCurrency } from './formatCurrency';
export { default as validateEmail } from './validateEmail';

// Individual utility files for better tree shaking
// utils/debounce.js
export default function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Package.json sideEffects configuration
{
  "sideEffects": [
    "*.css",
    "*.scss",
    "./src/polyfills.js"
  ]
}

// Babel configuration for tree shaking
{
  "presets": [
    ["@babel/preset-env", { "modules": false }]
  ],
  "plugins": [
    ["import", {
      "libraryName": "lodash",
      "libraryDirectory": "",
      "camel2DashComponentName": false
    }, "lodash"]
  ]
}
```

## 4. Caching Strategies

### Browser Caching Configuration

```javascript
// Service Worker for aggressive caching
// sw.js
const CACHE_NAME = 'booking-platform-v1.2.0';
const STATIC_CACHE = 'static-v1';
const DYNAMIC_CACHE = 'dynamic-v1';
const API_CACHE = 'api-v1';

const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/fonts/inter-var.woff2',
  '/css/critical.css',
  '/js/runtime.js',
  '/js/vendors.js',
  '/js/common.js',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => cache.addAll(STATIC_ASSETS))
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Static assets - Cache First
  if (STATIC_ASSETS.includes(url.pathname)) {
    event.respondWith(
      caches.match(request)
        .then(response => response || fetch(request))
    );
    return;
  }

  // API calls - Network First with fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then(response => {
          const responseClone = response.clone();
          caches.open(API_CACHE)
            .then(cache => cache.put(request, responseClone));
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Images - Cache First with update
  if (request.destination === 'image') {
    event.respondWith(
      caches.match(request)
        .then(response => {
          if (response) {
            // Update cache in background
            fetch(request)
              .then(fetchResponse => {
                caches.open(DYNAMIC_CACHE)
                  .then(cache => cache.put(request, fetchResponse));
              });
            return response;
          }
          return fetch(request)
            .then(fetchResponse => {
              const responseClone = fetchResponse.clone();
              caches.open(DYNAMIC_CACHE)
                .then(cache => cache.put(request, responseClone));
              return fetchResponse;
            });
        })
    );
    return;
  }

  // Default - Network First
  event.respondWith(
    fetch(request)
      .catch(() => caches.match(request))
  );
});

// HTTP headers for caching
// .htaccess or server configuration
<IfModule mod_expires.c>
  ExpiresActive On
  
  # Images
  ExpiresByType image/jpg "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/gif "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType image/webp "access plus 1 year"
  ExpiresByType image/avif "access plus 1 year"
  
  # Fonts
  ExpiresByType font/woff2 "access plus 1 year"
  ExpiresByType font/woff "access plus 1 year"
  
  # CSS and JavaScript
  ExpiresByType text/css "access plus 1 month"
  ExpiresByType application/javascript "access plus 1 month"
  
  # HTML
  ExpiresByType text/html "access plus 0 seconds"
</IfModule>

<IfModule mod_headers.c>
  # Cache immutable assets
  <FilesMatch "\.(css|js|woff2|woff|jpg|jpeg|png|gif|webp|avif)$">
    Header set Cache-Control "public, immutable, max-age=31536000"
  </FilesMatch>
  
  # Cache with revalidation for HTML
  <FilesMatch "\.html$">
    Header set Cache-Control "public, max-age=0, must-revalidate"
  </FilesMatch>
</IfModule>
```

### React Query Caching

```javascript
// React Query configuration for API caching
import { QueryClient, QueryClientProvider } from 'react-query';
import { ReactQueryDevtools } from 'react-query/devtools';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache for 5 minutes
      staleTime: 5 * 60 * 1000,
      // Keep in cache for 10 minutes
      cacheTime: 10 * 60 * 1000,
      // Retry failed requests 3 times
      retry: 3,
      // Retry with exponential backoff
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Refetch on window focus
      refetchOnWindowFocus: false,
      // Background refetch
      refetchOnMount: 'always',
    },
  },
});

// Specialist data caching
const useSpecialists = (filters) => {
  return useQuery(
    ['specialists', filters],
    () => fetchSpecialists(filters),
    {
      staleTime: 2 * 60 * 1000, // 2 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      keepPreviousData: true, // Keep showing old data while fetching new
    }
  );
};

// Infinite query for paginated data
const useSpecialistsPaginated = (filters) => {
  return useInfiniteQuery(
    ['specialists-paginated', filters],
    ({ pageParam = 1 }) => fetchSpecialists({ ...filters, page: pageParam }),
    {
      getNextPageParam: (lastPage, pages) => {
        return lastPage.hasMore ? pages.length + 1 : undefined;
      },
      staleTime: 5 * 60 * 1000,
      cacheTime: 15 * 60 * 1000,
    }
  );
};

// Prefetch critical data
const usePrefetchCriticalData = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Prefetch popular categories
    queryClient.prefetchQuery(
      ['categories', 'popular'],
      () => fetchPopularCategories(),
      {
        staleTime: 10 * 60 * 1000,
      }
    );

    // Prefetch user location-based specialists
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const { latitude, longitude } = position.coords;
        queryClient.prefetchQuery(
          ['specialists', 'nearby', { latitude, longitude }],
          () => fetchNearbySpecialists(latitude, longitude),
          {
            staleTime: 5 * 60 * 1000,
          }
        );
      });
    }
  }, [queryClient]);
};
```

## 5. Database & API Optimization

### Database Query Optimization

```sql
-- Optimized queries with proper indexing
-- Specialist search with location and filters
EXPLAIN ANALYZE
SELECT 
  s.id,
  s.business_name,
  s.description,
  s.rating,
  s.review_count,
  u.first_name,
  u.last_name,
  u.avatar_url,
  MIN(srv.price) as starting_price,
  -- Calculate distance using spatial index
  ST_Distance(s.location, ST_MakePoint($1, $2)) as distance
FROM specialists s
JOIN users u ON s.user_id = u.id
JOIN services srv ON srv.specialist_id = s.id
WHERE 
  s.is_verified = true 
  AND s.is_active = true
  AND srv.is_active = true
  AND srv.category = ANY($3)  -- Use array parameter for categories
  AND s.rating >= $4
  AND ST_DWithin(s.location, ST_MakePoint($1, $2), $5) -- Use spatial index
GROUP BY s.id, u.first_name, u.last_name, u.avatar_url, s.location
HAVING MIN(srv.price) BETWEEN $6 AND $7
ORDER BY 
  CASE WHEN $8 = 'distance' THEN distance END ASC,
  CASE WHEN $8 = 'rating' THEN s.rating END DESC,
  CASE WHEN $8 = 'price' THEN MIN(srv.price) END ASC
LIMIT $9 OFFSET $10;

-- Required indexes for optimal performance
CREATE INDEX CONCURRENTLY idx_specialists_verified_active 
ON specialists (is_verified, is_active) 
WHERE is_verified = true AND is_active = true;

CREATE INDEX CONCURRENTLY idx_specialists_rating 
ON specialists (rating DESC) 
WHERE is_verified = true AND is_active = true;

CREATE INDEX CONCURRENTLY idx_specialists_location_gist 
ON specialists USING GIST (location) 
WHERE is_verified = true AND is_active = true;

CREATE INDEX CONCURRENTLY idx_services_category_active 
ON services (category, is_active, specialist_id) 
WHERE is_active = true;

CREATE INDEX CONCURRENTLY idx_services_price 
ON services (price ASC) 
WHERE is_active = true;

-- Composite index for common filter combinations
CREATE INDEX CONCURRENTLY idx_specialists_rating_category_location 
ON specialists (rating DESC, is_verified, is_active) 
INCLUDE (location) 
WHERE is_verified = true AND is_active = true;
```

### API Response Optimization

```javascript
// Response compression and optimization
const express = require('express');
const compression = require('compression');
const helmet = require('helmet');

const app = express();

// Enable gzip compression
app.use(compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
  level: 6, // Balanced compression level
  threshold: 1024, // Only compress responses > 1KB
}));

// Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// Response caching middleware
const cacheMiddleware = (duration) => (req, res, next) => {
  res.set('Cache-Control', `public, max-age=${duration}`);
  next();
};

// Optimized specialist search endpoint
app.get('/api/specialists/search', 
  cacheMiddleware(300), // Cache for 5 minutes
  async (req, res) => {
    try {
      const {
        query,
        category,
        latitude,
        longitude,
        minRating = 0,
        maxDistance = 50000, // 50km default
        minPrice = 0,
        maxPrice = 10000,
        sortBy = 'rating',
        page = 1,
        limit = 20
      } = req.query;

      // Use database connection pool
      const pool = req.app.get('db');
      
      const offset = (page - 1) * limit;
      
      // Optimized query with prepared statement
      const result = await pool.query(
        SPECIALIST_SEARCH_QUERY,
        [
          parseFloat(latitude),
          parseFloat(longitude),
          category ? [category] : null,
          parseFloat(minRating),
          parseFloat(maxDistance),
          parseFloat(minPrice),
          parseFloat(maxPrice),
          sortBy,
          parseInt(limit),
          parseInt(offset)
        ]
      );

      // Transform and optimize response
      const specialists = result.rows.map(row => ({
        id: row.id,
        name: `${row.first_name} ${row.last_name}`,
        businessName: row.business_name,
        description: row.description,
        rating: parseFloat(row.rating),
        reviewCount: parseInt(row.review_count),
        startingPrice: parseFloat(row.starting_price),
        distance: Math.round(parseFloat(row.distance)),
        avatar: row.avatar_url,
        // Include only essential data in list view
      }));

      // Response with pagination metadata
      res.json({
        specialists,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: specialists.length > 0 ? specialists[0].total_count : 0,
          hasMore: specialists.length === parseInt(limit)
        },
        filters: {
          category,
          location: { latitude, longitude },
          rating: minRating,
          priceRange: { min: minPrice, max: maxPrice },
          sortBy
        }
      });

    } catch (error) {
      console.error('Search error:', error);
      res.status(500).json({ 
        error: 'Search failed',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

// Redis caching for frequently accessed data
const redis = require('redis');
const client = redis.createClient();

const cacheGet = async (key) => {
  try {
    const cached = await client.get(key);
    return cached ? JSON.parse(cached) : null;
  } catch (error) {
    console.error('Cache get error:', error);
    return null;
  }
};

const cacheSet = async (key, data, expiration = 300) => {
  try {
    await client.setex(key, expiration, JSON.stringify(data));
  } catch (error) {
    console.error('Cache set error:', error);
  }
};

// Cached specialist details endpoint
app.get('/api/specialists/:id', async (req, res) => {
  const { id } = req.params;
  const cacheKey = `specialist:${id}`;
  
  // Try to get from cache first
  let specialist = await cacheGet(cacheKey);
  
  if (!specialist) {
    // Fetch from database if not cached
    const result = await pool.query(
      SPECIALIST_DETAIL_QUERY,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Specialist not found' });
    }
    
    specialist = transformSpecialistData(result.rows[0]);
    
    // Cache for 10 minutes
    await cacheSet(cacheKey, specialist, 600);
  }
  
  res.json(specialist);
});
```

## 6. Performance Monitoring & Analytics

### Real User Monitoring (RUM)

```javascript
// Performance monitoring setup
const performanceObserver = new PerformanceObserver((list) => {
  list.getEntries().forEach((entry) => {
    // Track Core Web Vitals
    if (entry.entryType === 'largest-contentful-paint') {
      trackMetric('LCP', entry.startTime);
    }
    
    if (entry.entryType === 'layout-shift' && !entry.hadRecentInput) {
      trackMetric('CLS', entry.value);
    }
    
    // Track custom timing
    if (entry.entryType === 'measure') {
      trackMetric(entry.name, entry.duration);
    }
  });
});

performanceObserver.observe({ 
  entryTypes: ['largest-contentful-paint', 'layout-shift', 'measure'] 
});

// Track First Input Delay
const trackFID = () => {
  let firstInputDelay;
  
  const handleFirstInput = (event) => {
    firstInputDelay = event.processingStart - event.startTime;
    trackMetric('FID', firstInputDelay);
    
    // Remove listener after first interaction
    removeEventListener('click', handleFirstInput, true);
    removeEventListener('keydown', handleFirstInput, true);
  };
  
  addEventListener('click', handleFirstInput, true);
  addEventListener('keydown', handleFirstInput, true);
};

// Custom performance tracking
const trackPageLoad = () => {
  window.addEventListener('load', () => {
    const navigation = performance.getEntriesByType('navigation')[0];
    
    trackMetric('TTFB', navigation.responseStart - navigation.requestStart);
    trackMetric('DOMContentLoaded', navigation.domContentLoadedEventEnd - navigation.navigationStart);
    trackMetric('LoadComplete', navigation.loadEventEnd - navigation.navigationStart);
    
    // Track resource loading
    const resources = performance.getEntriesByType('resource');
    resources.forEach(resource => {
      if (resource.initiatorType === 'img') {
        trackMetric('ImageLoad', resource.duration, {
          url: resource.name,
          size: resource.transferSize
        });
      }
    });
  });
};

// Track API performance
const trackAPICall = async (url, options) => {
  const startTime = performance.now();
  
  try {
    const response = await fetch(url, options);
    const endTime = performance.now();
    
    trackMetric('APICall', endTime - startTime, {
      url,
      status: response.status,
      method: options?.method || 'GET'
    });
    
    return response;
  } catch (error) {
    const endTime = performance.now();
    
    trackMetric('APIError', endTime - startTime, {
      url,
      error: error.message,
      method: options?.method || 'GET'
    });
    
    throw error;
  }
};

// Send metrics to analytics
const trackMetric = (name, value, metadata = {}) => {
  // Send to Google Analytics
  gtag('event', 'web_vital', {
    event_category: 'Performance',
    event_label: name,
    value: Math.round(value),
    custom_map: metadata
  });
  
  // Send to custom analytics endpoint
  navigator.sendBeacon('/api/analytics/performance', JSON.stringify({
    metric: name,
    value,
    metadata,
    timestamp: Date.now(),
    url: window.location.href,
    userAgent: navigator.userAgent
  }));
};

// Performance budget alerts
const performanceBudget = {
  LCP: 2500, // 2.5s
  FID: 100,  // 100ms
  CLS: 0.1,  // 0.1
  TTFB: 600, // 600ms
  APICall: 1000 // 1s
};

const checkPerformanceBudget = (metric, value) => {
  const budget = performanceBudget[metric];
  if (budget && value > budget) {
    console.warn(`Performance budget exceeded for ${metric}: ${value}ms > ${budget}ms`);
    
    // Alert development team
    if (process.env.NODE_ENV === 'production') {
      trackMetric('BudgetExceeded', value, { metric, budget });
    }
  }
};
```

### Bundle Size Monitoring

```javascript
// Webpack bundle analyzer in CI/CD
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

// Generate bundle report
const generateBundleReport = () => {
  return new BundleAnalyzerPlugin({
    analyzerMode: 'json',
    reportFilename: 'bundle-report.json',
    generateStatsFile: true,
    statsFilename: 'bundle-stats.json',
  });
};

// Bundle size limits
const bundleSizeLimits = {
  'main': 250 * 1024,      // 250KB
  'vendors': 500 * 1024,   // 500KB
  'runtime': 10 * 1024,    // 10KB
  'common': 100 * 1024,    // 100KB
};

// Check bundle sizes in CI
const checkBundleSizes = (stats) => {
  const assets = stats.assets;
  let exceeded = false;
  
  assets.forEach(asset => {
    const chunkName = asset.chunks[0];
    const limit = bundleSizeLimits[chunkName];
    
    if (limit && asset.size > limit) {
      console.error(`Bundle size exceeded for ${chunkName}: ${asset.size} > ${limit}`);
      exceeded = true;
    }
  });
  
  if (exceeded) {
    process.exit(1);
  }
};

// Performance testing with Lighthouse CI
// .lighthouserc.js
module.exports = {
  ci: {
    collect: {
      url: [
        'http://localhost:3000/',
        'http://localhost:3000/search',
        'http://localhost:3000/specialist/1',
      ],
      numberOfRuns: 3,
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['error', { minScore: 0.9 }],
        'categories:seo': ['error', { minScore: 0.9 }],
        'first-contentful-paint': ['error', { maxNumericValue: 2000 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'first-meaningful-paint': ['error', { maxNumericValue: 2000 }],
        'speed-index': ['error', { maxNumericValue: 3000 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
      },
    },
    upload: {
      target: 'lhci',
      serverBaseUrl: 'https://lighthouse-ci.example.com',
    },
  },
};
```

This comprehensive performance optimization guide ensures the booking platform delivers fast, efficient user experiences while maintaining scalability and monitoring performance metrics continuously.