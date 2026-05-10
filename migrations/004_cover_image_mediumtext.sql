-- Change cover_image from VARCHAR(500) to MEDIUMTEXT to support base64 images
ALTER TABLE products MODIFY COLUMN cover_image MEDIUMTEXT;
