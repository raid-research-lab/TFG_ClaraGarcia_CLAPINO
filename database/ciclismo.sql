-- MySQL dump 10.13  Distrib 8.0.34, for Win64 (x86_64)
--
-- Host: localhost    Database: cicli80_03
-- ------------------------------------------------------
-- Server version	8.0.35

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `ciclista`
--

CREATE DATABASE IF NOT EXISTS ciclismo;

USE ciclismo;

DROP TABLE IF EXISTS `ciclista`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ciclista` (
  `dorsal` smallint NOT NULL,
  `nombre` varchar(30) NOT NULL,
  `edad` smallint DEFAULT NULL,
  `nomeq` varchar(25) NOT NULL,
  PRIMARY KEY (`dorsal`),
  KEY `equipociclista` (`nomeq`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ciclista`
--

LOCK TABLES `ciclista` WRITE;
/*!40000 ALTER TABLE `ciclista` DISABLE KEYS */;
INSERT INTO `ciclista` VALUES (1,'Miguel Induráin',32,'Banesto'),(2,'Pedro Delgado',35,'Banesto'),(3,'Alex Zulle',27,'ONCE'),(4,'Tony Rominger',30,'Mapei-Clas'),(5,'Gert-Jan Theunisse',32,'TVM'),(6,'Adriano Baffi',33,'Mercatone Uno'),(7,'Massimiliano Lelli',30,'Mercatone Uno'),(8,'Jean Van Poppel',33,'Lotus Festina'),(9,'Massimo Podenzana',34,'Navigare'),(10,'Mario Cipollini',28,'Mercatone Uno'),(11,'Flavio Giupponi',31,'Bresciali-Refin'),(12,'Alessio Di Basco',31,'Amore Vita'),(13,'Lale Cubino',28,'Seguros Amaya'),(14,'Roberto Pagnin',33,'Navigare'),(15,'Jesper Skibby',31,'TVM'),(16,'Dimitri Konishev',29,'Jolly Club'),(17,'Bruno Leali',37,'Bresciali-Refin'),(18,'Robert Millar',37,'TVM'),(19,'Julian Gorospe',34,'Banesto'),(20,'Alfonso Gutiérrez',29,'Artiach'),(21,'Erwin Nijboer',31,'Artiach'),(22,'Giorgio Furlan',32,'Gewiss'),(23,'Lance Armstrong',27,'Motorola'),(24,'Claudio Chiappucci',29,'Carrera'),(25,'Gianni Bugno',32,'Gatorade'),(26,'Mikel Zarrabeitia',27,'Banesto'),(27,'Laurent Jalabert',28,'ONCE'),(28,'Jesus Montoya',33,'Banesto'),(29,'Angel Edo',28,'Kelme'),(30,'Melchor Mauri',28,'Banesto'),(31,'Vicente Aparicio',30,'Banesto'),(32,'Laurent Dufaux',28,'ONCE'),(33,'Stefano della Santa',29,'Mapei-Clas'),(34,'Angel Yesid Camargo',30,'Kelme'),(35,'Erik Dekker',28,'Wordperfect'),(36,'Gian Matteo Fagnini',32,'Mercatone Uno'),(37,'Scott Sunderland',29,'TVM'),(38,'Javier Palacin',25,'Euskadi'),(39,'Rudy Verdonck',30,'Lotus Festina'),(40,'Viatceslav Ekimov',32,'Wordperfect'),(41,'Rolf Aldag',25,'Telecom'),(42,'Davide Cassani',29,'TVM'),(43,'Francesco Casagrande',28,'Mercatone Uno'),(44,'Luca Gelfi',27,'Gatorade'),(45,'Alberto Elli',26,'Artiach'),(46,'Agustin Sagasti',24,'Euskadi'),(47,'Laurent Pillon',32,'Gewiss'),(48,'Marco Saligari',29,'Gewiss'),(49,'Eugeni Berzin',23,'Gewiss'),(50,'Fernando Escartin',27,'Mapei-Clas'),(51,'Udo Bolts',30,'Telecom'),(52,'Vladislav Bobrik',26,'Gewiss'),(53,'Michele Bartoli',28,'Mercatone Uno'),(54,'Steffen Wesemann',30,'Telecom'),(55,'Nicola Minali',28,'Gewiss'),(56,'Andrew Hampsten',29,'Banesto'),(57,'Stefano Zanini',28,'Navigare'),(58,'Gerd Audehm',34,'Telecom'),(59,'Mariano Picolli',28,'Mercatone Uno'),(60,'Giovanni Lombardi',28,'Bresciali-Refin'),(61,'Walte Castignola',26,'Navigare'),(62,'Raul Alcala',30,'Motorola'),(63,'Alvaro Mejia',32,'Motorola'),(64,'Giuseppe Petito',28,'Mercatone Uno'),(65,'Pascal Lino',29,'Amore Vita'),(66,'Enrico Zaina',24,'Gewiss'),(67,'Armand de las Cuevas',28,'Castorama'),(68,'Angel Citracca',28,'Navigare'),(69,'Eddy Seigneur',27,'Castorama'),(70,'Sandro Heulot',29,'Banesto'),(71,'Prudencio Induráin',27,'Banesto'),(72,'Stefano Colage',28,'Bresciali-Refin'),(73,'Laurent Fignon',35,'Gatorade'),(74,'Claudio Chioccioli',36,'Amore Vita'),(75,'Juan Romero',32,'Seguros Amaya'),(76,'Marco Giovannetti',34,'Gatorade'),(77,'Javier Mauleon',33,'Mapei-Clas'),(78,'Antonio Esparza',35,'Kelme'),(79,'Johan Bruyneel',33,'ONCE'),(80,'Federico Echave',37,'Mapei-Clas'),(81,'Piotr Ugrumov',33,'Gewiss'),(82,'Edgar Corredor',30,'Kelme'),(83,'Hernan Buenahora',32,'Kelme'),(84,'Jon Unzaga',31,'Mapei-Clas'),(85,'Dimitri Abdoujaparov',30,'Carrera'),(86,'Juan Martinez Oliver',32,'Kelme'),(87,'Fernando Mota',32,'Artiach'),(88,'Angel Camarillo',28,'Mapei-Clas'),(89,'Stefan Roche',36,'Carrera'),(90,'Ivan Ivanov',27,'Artiach'),(91,'Nestor Mora',28,'Kelme'),(92,'Federico Garcia',27,'Artiach'),(93,'Bo Hamburger',29,'TVM'),(94,'Marino Alonso',30,'Banesto'),(95,'Manuel Guijarro',31,'Lotus Festina'),(96,'Tom Cordes',29,'Wordperfect'),(97,'Casimiro Moreda',28,'ONCE'),(98,'Eleuterio Anguita',25,'Artiach'),(99,'Per Pedersen',29,'Seguros Amaya'),(100,'William Palacios',30,'Jolly Club');
/*!40000 ALTER TABLE `ciclista` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `equipo`
--

DROP TABLE IF EXISTS `equipo`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `equipo` (
  `nomeq` varchar(25) NOT NULL,
  `director` varchar(30) DEFAULT NULL,
  PRIMARY KEY (`nomeq`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `equipo`
--

LOCK TABLES `equipo` WRITE;
/*!40000 ALTER TABLE `equipo` DISABLE KEYS */;
INSERT INTO `equipo` VALUES ('Amore Vita','Ricardo Padacci'),('Artiach','José Peréz'),('Banesto','Miguel Echevarria'),('Bresciali-Refin','Pietro Armani'),('Carrera','Luigi Petroni'),('Castorama','Jean Philip'),('Euskadi','Pedro Txucaru'),('Gatorade','Gian Luca Pacceli'),('Gewiss','Moreno Argentin'),('Jolly Club','Johan Richard'),('Kelme','Álvaro Pino'),('Lotus Festina','Suarez Cuevas'),('Mapei-Clas','Juan Fernandez'),('Mercatone Uno','Ettore Romano'),('Motorola','John Fidwell'),('Navigare','Lonrenzo Sciacci'),('ONCE','Manuel Sainz'),('PDM','Piet Van Der Kruis'),('Seguros Amaya','Minguez'),('Telecom','Morgan Reikcard'),('TVM','Steveens Henk'),('Wordperfect','Bill Gates');
/*!40000 ALTER TABLE `equipo` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `etapa`
--

DROP TABLE IF EXISTS `etapa`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `etapa` (
  `netapa` smallint NOT NULL,
  `km` smallint NOT NULL,
  `salida` varchar(35) NOT NULL,
  `llegada` varchar(35) NOT NULL,
  `dorsal` smallint DEFAULT NULL,
  PRIMARY KEY (`netapa`),
  KEY `ciclistaetapa` (`dorsal`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `etapa`
--

LOCK TABLES `etapa` WRITE;
/*!40000 ALTER TABLE `etapa` DISABLE KEYS */;
INSERT INTO `etapa` VALUES (1,9,'Valladolid','Valladolid',1),(2,180,'Valladolid','Salamanca',36),(3,240,'Salamanca','Caceres',12),(4,230,'Almendralejo','Córdoba',83),(5,170,'Córdoba','Granada',27),(6,150,'Granada','Sierra Nevada',52),(7,250,'Baza','Alicante',22),(8,40,'Benidorm','Benidorm',1),(9,150,'Benidorm','Valencia',35),(10,200,'Igualada','Andorra',2),(11,195,'Andorra','Estación de Cerler',65),(12,220,'Benasque','Zaragoza',12),(13,200,'Zaragoza','Pamplona',93),(14,172,'Pamplona','Alto de la Cruz de la Demanda',86),(15,207,'Santo Domingo de la Calzada','Santander',10),(16,160,'Santander','Lagos de Covadonga',5),(17,140,'Cangas de Onis','Alto del Naranco',4),(18,195,'Ávila','Ávila',8),(19,190,'Ávila','Destilerias Dyc',2),(20,52,'Segovia','Destilerias Dyc',2),(21,170,'Destilerias Dyc','Madrid',27);
/*!40000 ALTER TABLE `etapa` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `llevar`
--

DROP TABLE IF EXISTS `llevar`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `llevar` (
  `dorsal` smallint NOT NULL,
  `netapa` smallint NOT NULL,
  `codigo` varchar(3) NOT NULL,
  PRIMARY KEY (`netapa`,`codigo`),
  KEY `ciclistallevar` (`dorsal`),
  KEY `etapallevar` (`netapa`),
  KEY `maillotllevar` (`codigo`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `llevar`
--

LOCK TABLES `llevar` WRITE;
/*!40000 ALTER TABLE `llevar` DISABLE KEYS */;
INSERT INTO `llevar` VALUES (1,1,'MGE'),(1,1,'MMO'),(1,1,'MMV'),(1,1,'MRE'),(1,1,'MSE'),(1,2,'MGE'),(1,3,'MGE'),(1,4,'MGE'),(1,16,'MGE'),(1,17,'MGE'),(1,18,'MGE'),(1,19,'MGE'),(1,20,'MGE'),(1,21,'MGE'),(2,5,'MGE'),(2,6,'MGE'),(2,7,'MGE'),(2,21,'MMO'),(3,11,'MGE'),(3,12,'MGE'),(4,8,'MGE'),(8,2,'MSE'),(8,4,'MSE'),(10,18,'MSE'),(12,3,'MSE'),(12,5,'MSE'),(12,6,'MSE'),(16,2,'MMV'),(16,3,'MMV'),(16,5,'MMV'),(16,6,'MMV'),(17,4,'MMV'),(20,6,'MRE'),(20,7,'MRE'),(20,8,'MRE'),(20,9,'MRE'),(20,10,'MRE'),(20,11,'MRE'),(20,12,'MRE'),(20,13,'MRE'),(20,14,'MRE'),(20,15,'MRE'),(20,16,'MRE'),(20,17,'MRE'),(20,18,'MMV'),(20,19,'MRE'),(20,20,'MRE'),(20,21,'MRE'),(22,14,'MSE'),(22,15,'MSE'),(22,16,'MSE'),(22,17,'MSE'),(22,19,'MSE'),(22,20,'MSE'),(22,21,'MSE'),(24,4,'MMO'),(25,2,'MMO'),(25,3,'MMO'),(25,5,'MMO'),(26,6,'MMO'),(26,7,'MMO'),(26,8,'MMO'),(26,9,'MGE'),(26,9,'MMO'),(26,10,'MGE'),(26,18,'MMO'),(27,2,'MRE'),(27,3,'MRE'),(27,4,'MRE'),(27,5,'MRE'),(27,18,'MRE'),(28,14,'MMO'),(28,15,'MMO'),(28,16,'MMO'),(28,17,'MMO'),(28,19,'MMO'),(28,20,'MMO'),(30,10,'MMO'),(30,11,'MMO'),(30,12,'MMO'),(30,13,'MGE'),(30,13,'MMO'),(30,14,'MGE'),(30,15,'MGE'),(33,7,'MMV'),(33,8,'MMV'),(42,14,'MMV'),(42,15,'MMV'),(42,16,'MMV'),(42,17,'MMV'),(42,19,'MMV'),(42,20,'MMV'),(42,21,'MMV'),(48,9,'MMV'),(48,10,'MMV'),(48,11,'MMV'),(48,12,'MMV'),(48,13,'MMV'),(67,1,'MMS'),(67,3,'MMS'),(69,2,'MMS'),(69,4,'MMS'),(99,7,'MSE'),(99,8,'MSE'),(99,9,'MSE'),(99,10,'MSE'),(99,11,'MSE'),(99,12,'MSE'),(99,13,'MSE');
/*!40000 ALTER TABLE `llevar` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `maillot`
--

DROP TABLE IF EXISTS `maillot`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `maillot` (
  `codigo` varchar(3) NOT NULL,
  `tipo` varchar(30) NOT NULL,
  `color` varchar(20) NOT NULL,
  `premio` int NOT NULL,
  PRIMARY KEY (`codigo`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `maillot`
--

LOCK TABLES `maillot` WRITE;
/*!40000 ALTER TABLE `maillot` DISABLE KEYS */;
INSERT INTO `maillot` VALUES ('MGE','General','Amarillo',8000000),('MMO','Montaña','Blanco y Rojo',2000000),('MMS','Mas Sufrido','Estrellitas moradas',2000000),('MMV','Metas volantes','Rojo',2000000),('MRE','Regularidad','Verde',2000000),('MSE','Sprints especiales','Rosa',2000000);
/*!40000 ALTER TABLE `maillot` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `puerto`
--

DROP TABLE IF EXISTS `puerto`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `puerto` (
  `nompuerto` varchar(35) NOT NULL,
  `altura` smallint NOT NULL,
  `categoria` varchar(1) NOT NULL,
  `pendiente` double(15,5) DEFAULT NULL,
  `netapa` smallint NOT NULL,
  `dorsal` smallint DEFAULT NULL,
  PRIMARY KEY (`nompuerto`),
  KEY `ciclistapuerto` (`dorsal`),
  KEY `etapapuerto` (`netapa`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `puerto`
--

LOCK TABLES `puerto` WRITE;
/*!40000 ALTER TABLE `puerto` DISABLE KEYS */;
INSERT INTO `puerto` VALUES ('Alto del Naranco',565,'1',6.90000,10,30),('Arcalis',2230,'E',6.50000,10,4),('Cerler-Circo de Ampriu',2500,'E',5.87000,11,9),('Coll de la Comella',1362,'1',8.07000,10,2),('Coll de Ordino',1980,'E',5.30000,10,7),('Cruz de la Demanda',1850,'E',7.00000,11,20),('Lagos de Covadonga',1134,'E',6.86000,16,42),('Navacerrada',1860,'1',7.50000,19,2),('Puerto de Alisas',672,'1',5.80000,15,1),('Puerto de la Morcuera',1760,'2',6.50000,19,2),('Puerto de Mijares',1525,'1',4.90000,18,24),('Puerto de Navalmoral',1521,'2',4.30000,18,2),('Puerto de Pedro Bernardo',1250,'1',4.20000,18,25),('Sierra Nevada',2500,'E',6.00000,2,26);
/*!40000 ALTER TABLE `puerto` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-05-27  9:52:53
