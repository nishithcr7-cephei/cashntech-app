import {DrawerScreenProps} from '@react-navigation/drawer';
import {CompositeScreenProps} from '@react-navigation/native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {ClientNavigatorType, HomeNavigatorType} from '@type/NavigatorTypes';

export const ALL_FORMS = [
  {title: 'Basic Details', screen: 'BasicDetails'},
  {title: 'Client Details', screen: 'ClientDetails'},
   {title: 'Firm Details', screen: 'FirmDetails'},
  {title: 'Vendor Details', screen: 'VendorScreen'},
  {title: 'Visit Details', screen: 'VisitScreen'},
] as const;

export type ListItemProps = (typeof ALL_FORMS)[number];

export type NavigationType = CompositeScreenProps<
  NativeStackScreenProps<ClientNavigatorType, "FormSelectionScreen">,
  DrawerScreenProps<HomeNavigatorType>
>;

export type FormSelectionProps = {
  navigation: NavigationType['navigation'];
};
