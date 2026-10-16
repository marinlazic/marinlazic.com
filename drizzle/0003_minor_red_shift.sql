CREATE TABLE `applications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(200) NOT NULL,
	`email` varchar(320) NOT NULL,
	`q1_90day_goal` text NOT NULL,
	`q2_obstacle` text NOT NULL,
	`q3_investment` varchar(50) NOT NULL,
	`q4_anything_else` text,
	`assessmentData` text,
	`utmSource` varchar(200),
	`utmMedium` varchar(200),
	`utmCampaign` varchar(200),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `applications_id` PRIMARY KEY(`id`)
);
