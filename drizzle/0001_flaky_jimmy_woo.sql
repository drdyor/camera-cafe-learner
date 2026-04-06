CREATE TABLE `episodeProgress` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`episodeId` int NOT NULL,
	`watchedDuration` int NOT NULL DEFAULT 0,
	`percentageWatched` int NOT NULL DEFAULT 0,
	`lastWatchedAt` timestamp,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `episodeProgress_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `episodes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`season` int NOT NULL,
	`episodeNumber` int NOT NULL,
	`description` text,
	`duration` int NOT NULL,
	`difficulty` enum('A1','A2','B1','B2') NOT NULL,
	`videoUrl` text,
	`italianSubtitleUrl` text,
	`englishSubtitleUrl` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `episodes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `kellyList` (
	`id` int AUTO_INCREMENT NOT NULL,
	`lemma` varchar(255) NOT NULL,
	`pos` varchar(50),
	`cefrLevel` enum('A1','A2','B1','B2','C1','C2') NOT NULL,
	`frequencyRank` int NOT NULL,
	`ipm` decimal(10,2),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `kellyList_id` PRIMARY KEY(`id`),
	CONSTRAINT `kellyList_lemma_unique` UNIQUE(`lemma`)
);
--> statement-breakpoint
CREATE TABLE `phrases` (
	`id` int AUTO_INCREMENT NOT NULL,
	`episodeId` int NOT NULL,
	`italianText` text NOT NULL,
	`englishTranslation` text NOT NULL,
	`subtitleId` int,
	`startTime` int NOT NULL,
	`endTime` int NOT NULL,
	`wordCount` int NOT NULL,
	`minFrequencyRank` int NOT NULL,
	`cefrLevel` enum('A1','A2','B1','B2') NOT NULL,
	`isLearnable` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `phrases_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `subtitles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`episodeId` int NOT NULL,
	`language` enum('it','en') NOT NULL,
	`sequenceNumber` int NOT NULL,
	`startTime` int NOT NULL,
	`endTime` int NOT NULL,
	`text` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `subtitles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `userVocabulary` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`phraseId` int NOT NULL,
	`status` enum('learning','reviewing','mastered') NOT NULL DEFAULT 'learning',
	`timesEncountered` int NOT NULL DEFAULT 1,
	`lastReviewedAt` timestamp,
	`nextReviewAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `userVocabulary_id` PRIMARY KEY(`id`)
);
