import React from 'react';
import SearchPage from '../../pages/SearchPage';

const SearchPageRouter: React.FC = () => {
  // Show search page for all users - both authenticated and non-authenticated
  // All users should be able to search for services
  return <SearchPage />;
};

export default SearchPageRouter;