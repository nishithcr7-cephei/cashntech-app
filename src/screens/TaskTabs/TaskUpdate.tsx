import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
} from 'react-native';
import {
  AppBar,
  Container,
  CustomDropdown,
  DateNTimePicker,
  FooterButton,
  Input,
} from '@components/index';
import {LeftChevronCircle} from '@assets/Icons';
import Colors from '@constants/Colors';
import fontWeight from '@constants/FontWeight';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';
import {KeyboardAvoidingScrollView} from 'react-native-keyboard-avoiding-scroll-view';
import {useNavigation, useRoute} from '@react-navigation/native';
import {CompositeNavigationProp} from '@react-navigation/native';
import {DrawerNavigationProp} from '@react-navigation/drawer';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {HomeNavigatorType, DocNavigatorType} from '@type/NavigatorTypes';
import {useDispatch, useSelector} from 'react-redux';
import {tasklogActions} from '@store/tasklog';
import {tasklogSelector} from '@store/tasklog';
import Toast from 'react-native-toast-message';

type DocNavigationType = CompositeNavigationProp<
  DrawerNavigationProp<HomeNavigatorType>,
  NativeStackNavigationProp<DocNavigatorType>
>;

interface TaskUpdateParams {
  taskId: string;
  task_status: string;
  remark: string;
  completed_at: string;
  task_description: string;
  client_name: string;
  task_type: string;
  assigned_to: string;
}

export const TaskUpdate = () => {
  const navigation = useNavigation<DocNavigationType>();
  const route = useRoute();
  const params = route.params as TaskUpdateParams;
  const dispatch = useDispatch();
  const isSubmitting = useSelector(tasklogSelector.getTaskUpdateLoader);
  const successMessage = useSelector(tasklogSelector.getTaskUpdateSuccess);
  const errorMessage = useSelector(tasklogSelector.getTaskUpdateError);

  // State for form fields
  const [completedAt, setCompletedAt] = useState<Date | null>(
    params.completed_at ? new Date(params.completed_at) : new Date(),
  );
  const [salesPersonName, setSalesPersonName] = useState(params.assigned_to || '');
  const [taskType, setTaskType] = useState(params.task_type || '');
  const [taskDescription, setTaskDescription] = useState(params.task_description || '');
  const [status, setStatus] = useState(params.task_status || 'pending');
  const [remark, setRemark] = useState(params.remark || '');

  // Status options for dropdown
  const statusOptions = [
    {label: 'Pending', value: 'pending'},
    {label: 'Completed', value: 'completed'},
  ];

  // Clear any previous success/error states when component mounts
  useEffect(() => {
    // Clear any previous success/error messages
    dispatch(tasklogActions.setTaskUpdateSuccess(''));
    dispatch(tasklogActions.setTaskUpdateError(''));
  }, [dispatch]);

  // Watch for success/error messages
  useEffect(() => {
    if (successMessage && successMessage.trim()) {
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: successMessage,
      });
      navigation.goBack();
      // Clear the message after handling
      dispatch(tasklogActions.setTaskUpdateSuccess(''));
    }
  }, [successMessage, navigation, dispatch]);

  useEffect(() => {
    if (errorMessage && errorMessage.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: errorMessage,
      });
      // Clear the message after handling
      dispatch(tasklogActions.setTaskUpdateError(''));
    }
  }, [errorMessage, dispatch]);

  const handleSubmit = async () => {
    // Validation for editable fields
    if (!completedAt) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Please select a completion date',
      });
      return;
    }

    if (!status || status.trim() === '') {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Please select a task status',
      });
      return;
    }

    if (!remark || remark.trim() === '') {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Please enter a remark',
      });
      return;
    }

    // Send date in the required format: "2025-09-04T10:16:39.000Z"
    const updateData = {
      task_status: status,
      remark: remark.trim(),
      completed_at: completedAt.toISOString(),
    };

    dispatch(tasklogActions.updateTask({
      taskId: params.taskId,
      data: updateData,
    }));
  };

  const handleClear = () => {
    setCompletedAt(null);
    setStatus('pending');
    setRemark('');
  };

  return (
    <Container>
      <AppBar title="Update Task" navigation={navigation} />
      <View>
        <TouchableOpacity
          style={styles.subContainer}
          onPress={navigation.goBack}>
          <LeftChevronCircle height={26} width={26} />
          <Text style={styles.subheader}>Task Update</Text>
        </TouchableOpacity>
      </View>
      <KeyboardAvoidingScrollView style={{flexGrow: 1}}>
        <View style={styles.inputContainer}>
                     <DateNTimePicker
             label="Completed At"
             placeholder="Select Completion Date"
             value={completedAt || undefined}
             onConfirm={setCompletedAt}
             mode="date"
           />
          
          <Input
            label="Sales Person Name"
            placeholder="Sales Person Name"
            value={salesPersonName}
            editable={false}
          />
          
          <Input
            label="Task Type"
            placeholder="Task Type"
            value={taskType}
            editable={false}
          />
          
          <Input
            label="Task Description"
            placeholder="Task Description"
            value={taskDescription}
            editable={false}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
          
          <CustomDropdown
            label="Status"
            data={statusOptions}
            onChange={value => setStatus(value)}
            value={status}
            showSearch={false}
          />
          
                     <Input
             label="Remark"
             placeholder="Enter remark"
             value={remark}
             onChangeText={setRemark}
             multiline
             numberOfLines={6}
             textAlignVertical="top"
           />
           
           <View style={styles.buttonContainer}>
             <TouchableOpacity
               style={styles.submitButton}
               onPress={handleSubmit}
               disabled={isSubmitting}>
               <Text style={styles.submitButtonText}>Submit</Text>
             </TouchableOpacity>
             
             <TouchableOpacity
               style={styles.cancelButton}
               onPress={() => (navigation as any).navigate('ManageTask')}>
               <Text style={styles.cancelButtonText}>Cancel</Text>
             </TouchableOpacity>
           </View>
         </View>
       </KeyboardAvoidingScrollView>
               <Modal transparent visible={isSubmitting}>
         <View style={styles.loader}>
           <ActivityIndicator size="large" color="#e30613" />
         </View>
       </Modal>
    </Container>
  );
};

const styles = StyleSheet.create({
  subContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.LimeGray,
    paddingLeft: 16,
    paddingVertical: 12,
  },
  subheader: {
    marginLeft: 12,
    fontSize: scaleFont(16),
    fontWeight: fontWeight.SemiBold,
    color: Colors.darkblack,
  },
  inputContainer: {
    marginHorizontal: scaleWidth(24),
    marginTop: scaleHeight(17),
    gap: scaleHeight(20),
  },
        loader: {
     flex: 1,
     justifyContent: 'center',
     alignItems: 'center',
     backgroundColor: 'rgba(0,0,0,0.3)',
   },
   submitButton: {
     backgroundColor: Colors.green,
     borderRadius: 6,
     paddingVertical: scaleHeight(8),
     paddingHorizontal: scaleWidth(20),
     alignItems: 'center',
     justifyContent: 'center',
     flex: 0.4,
     marginRight: scaleWidth(10),
   },
   submitButtonText: {
     color: Colors.white,
     fontSize: scaleFont(14),
     fontWeight: fontWeight.SemiBold,
   },
   cancelButton: {
     backgroundColor: '#e30613',
     borderRadius: 6,
     paddingVertical: scaleHeight(8),
     paddingHorizontal: scaleWidth(20),
     alignItems: 'center',
     justifyContent: 'center',
     flex: 0.4,
     marginLeft: scaleWidth(10),
   },
   cancelButtonText: {
     color: Colors.white,
     fontSize: scaleFont(14),
     fontWeight: fontWeight.SemiBold,
   },
   buttonContainer: {
     flexDirection: 'row',
     marginTop: scaleHeight(20),
     justifyContent: 'center',
   },
 });


