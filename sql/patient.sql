CREATE TABLE `patients` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  `sex` varchar(5) NOT NULL,
  `age` varchar(5) NOT NULL,
  `height` int(4),
  `weight` DECIMAL(5,1),
  `userid` int(11),
  PRIMARY KEY (id),
  FOREIGN KEY (userid)
  REFERENCES users(id)
 ) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4;