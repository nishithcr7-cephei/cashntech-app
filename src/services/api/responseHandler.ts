// import {Result, tryCatch} from '@utils/TryCatch';
// import {AxiosError, AxiosResponse} from 'axios';
// import {CustomRequestConfig} from './api';

// export const responseHandler = async <T, Z>(
//   apiRequest: Promise<AxiosResponse<T, CustomRequestConfig>>,
// ): Promise<Result<T, Z>> => {
//   const {data, error} = await tryCatch<
//     AxiosResponse<T, CustomRequestConfig>,
//     AxiosError<Z, CustomRequestConfig>
//   >(apiRequest);

//   if (error) {
//     if (error.response) {
//       return {
//         data: null,
//         error: error.response.data,
//       };
//     }
//   }

//   return {
//     data: data.data,
//     error: null,
//   };
// };
