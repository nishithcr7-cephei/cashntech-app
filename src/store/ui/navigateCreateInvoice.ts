import {InteractionManager} from 'react-native';
import type {AppDispatch} from '@store/app/store';
import {setOpeningCreateInvoice} from './ui.slice';

type CreateInvoiceNavParams = Record<string, unknown> | undefined;

type CreateInvoiceNavigation = {
  navigate: (name: string, params?: CreateInvoiceNavParams) => void;
};

export function navigateToCreateInvoice(
  dispatch: AppDispatch,
  navigation: CreateInvoiceNavigation,
  params?: CreateInvoiceNavParams,
): void {
  dispatch(setOpeningCreateInvoice(true));
  requestAnimationFrame(() => {
    InteractionManager.runAfterInteractions(() => {
      navigation.navigate('CreateInvoice', params);
    });
  });
}
