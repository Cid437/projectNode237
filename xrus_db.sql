-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jul 04, 2026 at 01:37 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `xrus_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `categories`
--

CREATE TABLE `categories` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `categories`
--

INSERT INTO `categories` (`id`, `name`, `description`, `created_at`, `updated_at`) VALUES
(1, 'Luxury & Dress', 'Premium mechanical and automatic watches crafted for formal occasions and collections.', '2026-07-04 08:49:51', '2026-07-04 08:49:51'),
(2, 'Dive & Sports', 'Rugged, water-resistant timepieces designed for professional diving and active lifestyles.', '2026-07-04 08:49:51', '2026-07-04 08:49:51'),
(3, 'Chronographs', 'High-precision watches equipped with stopwatch features and multi-dial displays.', '2026-07-04 08:49:51', '2026-07-04 08:49:51'),
(4, 'Minimalist & Casual', 'Clean, modern layouts perfect for everyday wear and sleek styling.', '2026-07-04 08:49:51', '2026-07-04 08:49:51'),
(5, 'Smart & Hybrid', 'Tech-forward wearables blending classic watch aesthetics with modern tracking features.', '2026-07-04 08:49:51', '2026-07-04 08:49:51');

-- --------------------------------------------------------

--
-- Table structure for table `items`
--

CREATE TABLE `items` (
  `id` int(11) NOT NULL,
  `category_id` int(11) NOT NULL,
  `name` varchar(150) NOT NULL,
  `description` text DEFAULT NULL,
  `brand` varchar(100) DEFAULT NULL,
  `buy_price` decimal(10,2) NOT NULL,
  `sell_price` decimal(10,2) NOT NULL,
  `stock` int(11) NOT NULL DEFAULT 0,
  `image` varchar(255) DEFAULT NULL,
  `status` enum('active','inactive') NOT NULL DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `items`
--

INSERT INTO `items` (`id`, `category_id`, `name`, `description`, `brand`, `buy_price`, `sell_price`, `stock`, `image`, `status`, `created_at`, `updated_at`) VALUES
(1, 1, 'Submariner Date', 'The quintessential luxury divers watch, featuring a stunning black dial and oyster steel bracelet.', 'Rolex', 450000.00, 580000.00, 3, 'rolex_submariner.jpg', 'active', '2026-07-04 08:49:51', '2026-07-04 08:49:51'),
(2, 2, 'Seamaster Diver 300M', 'Professional dive watch with a laser-engraved blue ceramic dial and helium escape valve.', 'Omega', 210000.00, 295000.00, 5, 'omega_seamaster.jpg', 'active', '2026-07-04 08:49:51', '2026-07-04 08:49:51'),
(3, 3, 'Speedmaster Moonwatch', 'The legendary manual-winding chronograph worn by astronauts during lunar missions.', 'Omega', 280000.00, 385000.00, 4, 'omega_speedmaster.jpg', 'active', '2026-07-04 08:49:51', '2026-07-04 08:49:51'),
(4, 4, 'Bambino Version 4', 'A elegant, affordable automatic dress watch with a domed mineral crystal and rich emerald dial.', 'Orient', 10000.00, 10000.00, 14, 'images/OIP (1)-1783164787979-37000229.jpg', 'active', '2026-07-04 08:49:51', '2026-07-04 11:33:07');

-- --------------------------------------------------------

--
-- Table structure for table `orders`
--

CREATE TABLE `orders` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `order_number` varchar(30) NOT NULL,
  `subtotal` decimal(10,2) NOT NULL DEFAULT 0.00,
  `shipping_fee` decimal(10,2) NOT NULL DEFAULT 0.00,
  `discount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `total_amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `payment_method` enum('Cash','GCash','Card') NOT NULL,
  `payment_status` enum('Pending','Paid','Refunded') DEFAULT 'Pending',
  `order_status` enum('Pending','Processing','Shipped','Completed','Cancelled') DEFAULT 'Pending',
  `shipping_address` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `order_items`
--

CREATE TABLE `order_items` (
  `id` int(11) NOT NULL,
  `order_id` int(11) NOT NULL,
  `item_id` int(11) NOT NULL,
  `quantity` int(11) NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `subtotal` decimal(10,2) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `first_name` varchar(100) NOT NULL,
  `last_name` varchar(100) NOT NULL,
  `username` varchar(50) NOT NULL,
  `email` varchar(150) NOT NULL,
  `password` varchar(255) NOT NULL,
  `phone` varchar(30) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `image_url` varchar(255) DEFAULT NULL,
  `role` enum('customer','admin') NOT NULL DEFAULT 'customer',
  `status` enum('active','inactive') NOT NULL DEFAULT 'active',
  `token` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `first_name`, `last_name`, `username`, `email`, `password`, `phone`, `address`, `role`, `status`, `token`, `created_at`, `updated_at`) VALUES
(36, 'donn', '', 'donn', 'donn@xrus.com', '$2b$10$269Cpedi8MyQ35naUm9XtuTFQBkuwuMNVPpYLNzJActTb/BAFyXgK', NULL, NULL, 'admin', 'active', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MzYsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc4MzE2NDY3NH0.izqjICi1cn6TSY_rPvvrDBIbD7CUYnbAFguPV2CGedE', '2026-07-04 09:02:19', '2026-07-04 11:31:14'),
(37, 'user', '', 'user', 'user@xrus.com', '$2b$10$yLk7UneawSBvjb9D6FMCIuIpXY2ahYMZGMWXuAh4qnchs0k3MUaOy', NULL, NULL, 'customer', 'active', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MzcsInJvbGUiOiJjdXN0b21lciIsImlhdCI6MTc4MzE2NDUwNX0.Ks7qgsO8d2izP4haYIZQ9GrBw3ZJ38QGbCcN6ir1hE0', '2026-07-04 09:15:13', '2026-07-04 11:28:25');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `categories`
--
ALTER TABLE `categories`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indexes for table `items`
--
ALTER TABLE `items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_items_category` (`category_id`);

--
-- Indexes for table `orders`
--
ALTER TABLE `orders`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `order_number` (`order_number`),
  ADD KEY `idx_orders_user` (`user_id`),
  ADD KEY `idx_orders_status` (`order_status`);

--
-- Indexes for table `order_items`
--
ALTER TABLE `order_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_order_items_order` (`order_id`),
  ADD KEY `idx_order_items_item` (`item_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `idx_users_email` (`email`),
  ADD KEY `idx_users_username` (`username`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `categories`
--
ALTER TABLE `categories`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `items`
--
ALTER TABLE `items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT for table `orders`
--
ALTER TABLE `orders`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `order_items`
--
ALTER TABLE `order_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=38;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `items`
--
ALTER TABLE `items`
  ADD CONSTRAINT `fk_items_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `orders`
--
ALTER TABLE `orders`
  ADD CONSTRAINT `fk_orders_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `order_items`
--
ALTER TABLE `order_items`
  ADD CONSTRAINT `fk_orderitems_item` FOREIGN KEY (`item_id`) REFERENCES `items` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_orderitems_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
-- MP3: support multiple images per item without breaking existing single-image column.
-- items.image is KEPT as-is and continues to store the first/primary image
-- (so every existing query, including getAllItems and the DataTable, keeps working unchanged).
-- item_images stores every uploaded file for an item (one-to-many).

CREATE TABLE IF NOT EXISTS item_images (
    id INT(11) NOT NULL AUTO_INCREMENT,
    item_id INT(11) NOT NULL,
    image_path VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    KEY idx_item_images_item_id (item_id),

    CONSTRAINT fk_item_images_item
        FOREIGN KEY (item_id)
        REFERENCES items(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

ALTER TABLE users ADD COLUMN town VARCHAR(100) DEFAULT NULL AFTER address;
ALTER TABLE users ADD COLUMN zipcode VARCHAR(10) DEFAULT NULL AFTER town;

ALTER TABLE orders DROP COLUMN total_amount;