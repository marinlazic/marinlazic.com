CREATE TABLE `assessment_progress` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(320) NOT NULL,
	`name` varchar(200),
	`answers` text,
	`resumeToken` varchar(64) NOT NULL,
	`totalQuestions` int DEFAULT 0,
	`answeredCount` int DEFAULT 0,
	`completed` boolean NOT NULL DEFAULT false,
	`notifiedAt` timestamp,
	`utmSource` varchar(200),
	`utmMedium` varchar(200),
	`utmCampaign` varchar(200),
	`lastActivityAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `assessment_progress_id` PRIMARY KEY(`id`),
	CONSTRAINT `assessment_progress_resumeToken_unique` UNIQUE(`resumeToken`)
);
