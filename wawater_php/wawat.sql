drop database if exists wawater;
create database wawater;
use wawater;

create table Firm(id int primary key auto_increment, name varchar(40) not null unique, email varchar(40) not null unique, check (email like '%@%'));
insert into Firm(name, email) values('ddcorp','ddcorp@seznam.cz');

create table Client(id int primary key auto_increment, username  varchar(20) not null unique, password blob not null, email varchar(40) not null unique, firm_id int not null, is_admin bit not null, constraint foreign key (firm_id) references Firm(id) on delete cascade,check (email like '%@%'));
-- insert into Client(username, password, email, firm_id, is_admin) values('a','a','a@a',1,0);


create table Property(id int primary key auto_increment, name varchar(40) not null, address varchar(45) not null, client_id int not null, constraint foreign key (client_id) references Client(id) on delete cascade);
-- insert into Property(name, address, client_id) values('ak','ak',1);


create table GaugeType(id int primary key auto_increment, name varchar(20) not null ,short_name varchar(5) not null, value_unit varchar(10) not null);
insert into GaugeType(name,short_name, value_unit) values ('Vodoměr SV','SV','m3'),('Vodoměr TV','TV','m3'),('Měřidlo ITN','ITN','pom. jed.');

create table Gauge(id int primary key auto_increment,guid varchar(20) not null, serial_number varchar(20) not null, property_id int not null , gauge_type_id int not null,location_sign varchar(5) not null,
constraint foreign key (property_id) references Property(id) on delete cascade,
constraint foreign key (gauge_type_id) references GaugeType(id));

-- insert into Gauge(guid, serial_number, property_id, gauge_type_id, location_sign) values ('TZZA',2565,1,1,'P4');
-- insert into Gauge(guid, serial_number, property_id, gauge_type_id, location_sign) values ('AXAX',2565,1,2,'S4');
-- insert into Gauge(guid, serial_number, property_id, gauge_type_id, location_sign) values ('BBBH',1169,1,2,'S3');
-- insert into Gauge(guid, serial_number, property_id, gauge_type_id, location_sign) values ('KOLO',17891,1,3,'S3');


create table GaugeDecrease(id int primary key auto_increment, decrease_date date not null, value float not null, gauge_id int not null, constraint foreign key (gauge_id) references Gauge(id) on delete cascade);

-- insert into GaugeDecrease(decrease_date, value, gauge_id) values ('2024-12-11',2.5, 1);
-- insert into GaugeDecrease(decrease_date, value, gauge_id) values ('2024-12-11',2.5, 2);

-- insert into GaugeDecrease(decrease_date, value, gauge_id) values ('2025-01-11',12.3, 2);
-- insert into GaugeDecrease(decrease_date, value, gauge_id) values ('2025-02-11',15.3, 2);
-- insert into GaugeDecrease(decrease_date, value, gauge_id) values ('2025-01-11',12.3, 3);
-- insert into GaugeDecrease(decrease_date, value, gauge_id) values ('2025-02-11',15.3, 4);



create table GaugeMaxExceeded(id int primary key auto_increment, client_id int not null, gauge_id int not null unique, max_value int not null, constraint foreign key (client_id) references Client(id) on delete cascade, constraint foreign key (gauge_id) references Gauge(id) on delete cascade);
create table GaugeMonthAverageExceeded(id int primary key auto_increment, client_id int not null, gauge_id int not null unique, constraint foreign key (client_id) references Client(id) on delete cascade, constraint foreign key (gauge_id) references Gauge(id) on delete cascade);
create table GaugeMonthOverview(id int primary key auto_increment, client_id int not null unique, constraint foreign key (client_id) references Client(id) on delete cascade);


CREATE PROCEDURE GaugeMonthAverageExceededCheck(in `gauge_id` int, in `month` int,in `year` int, out `exceeded` bit) 
set @past_avg = (select avg(value) from GaugeDecrease where (gauge_id = @`gauge_id`  and MONTH(decrease_date) = @`month`));
set @current_sum = (select sum(value) from GaugeDecrease where (gauge_id = @`gauge_id`  and MONTH(decrease_date) = @`month` and YEAR(decrease_date) = @`year`));       
set @`exceeded` = ( @current_sum > @past_avg);


CREATE PROCEDURE GaugeMaxExceededDuringMonthCheck(in `gauge_id` int, in `month` int,in `year` int, out `exceeded` bit) 
set @max = (select max_value from GaugeMaxExceeded where gauge_id = @`gauge_id`);
set @sum = (select sum(value) from GaugeDecrease where (gauge_id = @`gauge_id`  and MONTH(decrease_date) = @`month`and YEAR(decrease_date) = @`year`));
set @`exceeded` = ( @sum > @max); 



create procedure GaugeBelongsToUserCheck(in `gauge_id` int, in `property_name` varchar(40), in `firm_id` int, in `username` varchar(20),  out `belongs` bit)
set @`belongs` = (@`gauge_id`  in (select id from Gauge where property_id in (select id from Property where name = @`property_name` and client_id in (select id from Client where firm_id = @`firm_id` and username = @`username`))));


-- create procedure AllGaugeDecreaseDataForUserin (in `client_id` int, in `date_start` date, `date_end` date, ,  out `belongs` bit)

-- select Gauge.guid, Gauge.serial_number, Gauge.location_sign,
--  GaugeType.name as gauge_type, GaugeType.value_unit,Property.name as property_name,
--  Property.address , Sum(GaugeDecrease.value) as gauge_value from Gauge 
-- inner join GaugeType on Gauge.gauge_type_id = GaugeType.id 
-- inner join GaugeDecrease on GaugeDecrease.gauge_id = Gauge.id 
-- inner join Property on Property.id = Gauge.property_id
-- where Property.client_id = 1
-- and GaugeDecrease.decrease_date between ? and ?
-- group by guid;

-- select GaugeType.name, GaugeType.value_unit,  sum(value) as value from GaugeDecrease 
-- inner join Gauge on Gauge.id = GaugeDecrease.gauge_id
-- inner join GaugeType on GaugeType.id = Gauge.gauge_type_id
-- where Gauge.property_id in (select id from Property where client_id = ?)
-- and GaugeDecrease.decrease_date between ? and ? 
-- group by GaugeType.name;


--  select Gauge.guid, Gauge.serial_number, Gauge.location_sign, GaugeType.name as gauge_type, GaugeType.value_unit,Property.name as property_name, Property.address , Sum(GaugeDecrease.value) as gauge_value from GaugeDecrease 
--                right outer join Gauge on GaugeDecrease.gauge_id = Gauge.id 
--                inner join GaugeType on Gauge.gauge_type_id = GaugeType.id 
                
--                 inner join Property on Property.id = Gauge.property_id
--                 where Property.client_id = ?
--                 and GaugeDecrease.decrease_date between ? and ? 
--                 group by guid;





 select GaugeType.name, GaugeType.value_unit,   sum(value) as value from GaugeDecrease 
 				right outer join Gauge on Gauge.id = GaugeDecrease.gauge_id and decrease_date between '2020-02-02' and '2020-02-02'
                 left outer join GaugeType on GaugeType.id = Gauge.gauge_type_id
                 where Gauge.property_id in (select id from Property where client_id = 1)
                 group by GaugeType.name;
				
                
                select * from GaugeDecrease;
  select Gauge.guid, Gauge.serial_number, Gauge.location_sign, GaugeType.name as gauge_type, GaugeType.value_unit,Property.name as property_name, GaugeDecrease.decrease_date,
                 Property.address , Sum(GaugeDecrease.value) as gauge_value
			from GaugeDecrease
            right outer join Gauge on GaugeDecrease.gauge_id = Gauge.id and decrease_date between '2020-02-02' and '2020-02-02'
             
             right outer join GaugeType on Gauge.gauge_type_id = GaugeType.id
               right outer join Property on Property.id = Gauge.property_id
            and Property.client_id = 1
                group by guid              
                
                
                
                
--                  select Gauge.guid, Gauge.serial_number, Gauge.location_sign, GaugeType.name as gauge_type, GaugeType.value_unit,Property.name as property_name, Property.address , Sum(GaugeDecrease.value) as gauge_value from GaugeDecrease
         
--             right outer join Gauge on GaugeDecrease.gauge_id = Gauge.id
--              right outer join GaugeType on Gauge.gauge_type_id = GaugeType.id

--              right outer join Property on Property.id = Gauge.property_id
--                where decrease_date between '2020-02-02' and '2020-02-02'
--             and Property.client_id = 1
--                 group by guid
--                 -- and decrease_date between '2020-02-02' and '2020-02-02'

