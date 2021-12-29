CREATE TABLE `recorders` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `time` Time,
  `path` varchar(300),
  `patientid` int(11),
  FOREIGN KEY (patientid)
  REFERENCES patients(id),
  PRIMARY KEY (id)
 ) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4;