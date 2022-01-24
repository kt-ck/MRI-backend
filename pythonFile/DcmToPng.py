from unicodedata import name
from numpy import save
from Lib.DcmHandle import ConvertDICOMDirToNumpyArray
import sys
import os
import cv2
if __name__ == "__main__":
    person_name = sys.argv[1]
    dir = os.path.join("./mri/dcm/Persons/Unhandle", person_name)
    save_dir = os.path.join("./mri/dcm/out", person_name)
    if not os.path.exists(save_dir):
        os.mkdir(save_dir)

    if os.path.exists(dir):
        imgs, name_list = ConvertDICOMDirToNumpyArray(dir)
        for index in range(imgs.shape[0]):
            file_name = name_list[index].split("\\")[2]
            cv2.imwrite(os.path.join(save_dir, file_name.split(".")[0] + ".png"), imgs[index])
            os.rename(name_list[index], "./mri/dcm/Persons/" + person_name + "/" + file_name)
        print("处理成功")
        os.rmdir(dir)
    else:
        print("文件不存在")
    sys.stdout.flush()
    
