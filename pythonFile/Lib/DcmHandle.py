import SimpleITK
import numpy as np


def ConvertDICOMDirToNumpyArray(dicom_dir):
    '''
    :input: the dictionary containing patient's dicom image
    :type input: str
    :output: the numpy array containing all patients and their names
    :type output: numpy.ndarray, 
    '''
    reader = SimpleITK.ImageSeriesReader()
    dicom_names = reader.GetGDCMSeriesFileNames(dicom_dir)
    reader.SetFileNames(dicom_names)
    image = reader.Execute()
    img_array = SimpleITK.GetArrayFromImage(image)
    img_array[img_array == -2000] = 0
    return img_array, dicom_names

if __name__ == "__main__":
    ConvertDICOMDirToNumpyArray("./mri/dcm/Persons/Unhandle/ck")
