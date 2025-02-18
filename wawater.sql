drop database if exists wawater;
create database wawater;
use wawater;

create table Firm(id int primary key auto_increment, name varchar(40) not null unique, email varchar(40) not null unique, check (email like '%@%'));
insert into Firm(name, email) values('ddcorp','ddcorp@seznam.cz');

create table Client(id int primary key auto_increment, username  varchar(20) not null unique, password blob not null, email varchar(40) not null unique, firm_id int not null, is_admin bit not null, constraint foreign key (firm_id) references Firm(id),check (email like '%@%'));
create table Property(id int primary key auto_increment, name varchar(40) not null, address varchar(45) not null, client_id int not null, constraint foreign key (client_id) references Client(id));

create table GaugeType(id int primary key auto_increment, name varchar(20) not null ,short_name varchar(5) not null, value_unit varchar(10) not null);
insert into GaugeType(name,short_name, value_unit) values ('Vodoměr SV','SV','m3'),('Vodoměr TV','TV','m3'),('Měřidlo ITN','ITN','pom. jed.');

create table Gauge(id int primary key auto_increment,guid varchar(20) not null, serial_number varchar(20) not null, property_id int not null, gauge_type_id int not null,location_sign varchar(5) not null,
constraint foreign key (property_id) references Property(id),
constraint foreign key (gauge_type_id) references GaugeType(id));

create table GaugeDecrease(id int primary key auto_increment, decrease_date date not null, value float not null, gauge_id int not null, constraint foreign key (gauge_id) references Gauge(id));

create table GaugeMaxExceeded(id int primary key auto_increment, client_id int not null, gauge_id int not null unique, max_value int not null, constraint foreign key (client_id) references Client(id), constraint foreign key (gauge_id) references Gauge(id));
create table GaugeMonthAverageExceeded(id int primary key auto_increment, client_id int not null, gauge_id int not null unique, constraint foreign key (client_id) references Client(id), constraint foreign key (gauge_id) references Gauge(id));
create table GaugeMonthOverview(id int primary key auto_increment, client_id int not null unique, constraint foreign key (client_id) references Client(id));


DELIMITER $$
CREATE PROCEDURE GaugeMonthAverageExceededCheck(in `g_id` int, in `m` int,in `y` int, out `exceeded` bit) 
begin
if not exists (select 1 from GaugeMonthAverageExceeded where gauge_id = `g_id`) 
then
set `exceeded` = 0;
else
set @past_avg = (select avg(value) from GaugeDecrease where (gauge_id = `g_id`  and MONTH(decrease_date) = `m`));
set @current_sum = (select sum(value) from GaugeDecrease where (gauge_id = `g_id`  and MONTH(decrease_date) = `m` and YEAR(decrease_date) = `y`));       
set `exceeded` = ( @current_sum > @past_avg);
end if;
end$$
DELIMITER ;



DELIMITER $$
create procedure GaugeMaxExceededDuringMonthCheck(in `g_id` int, in `m` int,in  `y` int, out `exceeded` bit)
begin
if not exists (select 1 from GaugeMaxExceeded where gauge_id = `g_id`) 
then
select 'not in';
set `exceeded` = 0;
else
set @max = (select max_value from GaugeMaxExceeded where gauge_id = `g_id`);
set @sum = (select sum(value) from GaugeDecrease where (gauge_id = `g_id`  and MONTH(decrease_date) =  `m` and YEAR(decrease_date) =  `y`));
set `exceeded` = ( @sum > @max); 
end if;
end$$
DELIMITER ;



create procedure GaugeBelongsToUserCheck(in `gauge_id` int, in `property_name` varchar(40), in `firm_id` int, in `username` varchar(20),  out belongs bit)
set belongs =  (`gauge_id`  in (select id from Gauge where property_id in (select id from Property where name = `property_name` and client_id in (select id from Client where firm_id = `firm_id` and username = `username`))));


