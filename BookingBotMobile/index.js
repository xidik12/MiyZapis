// Import Reanimated at the very top to ensure native module is initialized
import 'react-native-reanimated';

import { registerRootComponent } from 'expo';
import App from './App';

// Register the main component
registerRootComponent(App);

