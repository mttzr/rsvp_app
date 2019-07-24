const fs = require('fs');

module.exports = {
    addGuestPage: (req, res) => {
        res.render('add-guest.ejs', {
            title: 'Welcome to RSVP_App | Add a new guest'
            ,message: ''
        });
    },
    addGuest: (req, res) => {
        if (!req.files) {
            return res.status(400).send("No files were uploaded.");
        }

        let message = '';
        let first_name = req.body.first_name;
        let last_name = req.body.last_name;
        let overnight_accomodations = req.body.overnight_accomodations;
        let dietary_restrictions = req.body.dietary_restrictions;
        let username = req.body.username;
        let uploadedFile = req.files.image;
        let image_name = uploadedFile.name;
        let fileExtension = uploadedFile.mimetype.split('/')[1];
        image_name = username + '.' + fileExtension;

        
        /*This app is subject to SQL injection because the code
        allows user input to pass through as-is. No escaping or character filtering whatsoever.*/

        let usernameQuery = "SELECT * FROM `guests` WHERE user_name = '" + username + "'";

        db.query(usernameQuery, (err, result) => {
            if (err) {
                return res.status(500).send(err);
            }
            if (result.length > 0) {
                message = 'Username already exists';
                res.render('add-guest.ejs', {
                    message,
                    title: 'Welcome to RSVP | Add a new guest'
                });
            } else {
                // check the filetype before uploading it
                if (uploadedFile.mimetype === 'image/png' || uploadedFile.mimetype === 'image/jpeg' || uploadedFile.mimetype === 'image/gif') {
                    // upload the file to the /public/assets/img directory
                    uploadedFile.mv(`public/assets/img/${image_name}`, (err ) => {
                        if (err) {
                            return res.status(500).send(err);
                        }
                        // send the guest's details to the database
                        let query = "INSERT INTO `guests` (first_name, last_name, overnight_accomodations, dietary_restrictions, image, user_name) VALUES ('" +
                            first_name + "', '" + last_name + "', '" + overnight_accomodations + "', '" + dietary_restrictions + "', '" + image_name + "', '" + username + "')";
                        db.query(query, (err, result) => {
                            if (err) {
                                return res.status(500).send(err);
                            }
                            res.redirect('/');
                        });
                    });
                } else {
                    message = "Invalid File format. Only 'gif', 'jpeg' and 'png' images are allowed.";
                    res.render('add-guest.ejs', {
                        message,
                        title: 'Welcome to RSVP | Add a new guest'
                    });
                }
            }
        });
    },
    editGuestPage: (req, res) => {
        let guestId = req.params.id;
        let query = "SELECT * FROM `guests` WHERE id = '" + guestId + "' ";
        db.query(query, (err, result) => {
            if (err) {
                return res.status(500).send(err);
            }
            res.render('edit-guest.ejs', {
                title: 'Edit  Guest'
                ,guest: result[0]
                ,message: ''
            });
        });
    },
    editGuest: (req, res) => {
        let guestId = req.params.id;
        let first_name = req.body.first_name;
        let last_name = req.body.last_name;
        let overnight_accomodations = req.body.overnight_accomodations;
        let dietary_restrictions = req.body.dietary_restrictions;

        let query = "UPDATE `guests` SET `first_name` = '" + first_name + "', `last_name` = '" + last_name + "', `overnight_accomodations` = '" + overnight_accomodations + "', `dietary_restrictions` = '" + dietary_restrictions + "' WHERE `guests`.`id` = '" + guestId + "'";
        db.query(query, (err, result) => {
            if (err) {
                return res.status(500).send(err);
            }
            res.redirect('/');
        });
    },

    /*This app is vulnerable to a CSRF attack. The delete functionality calls the following
     url: http://localhost:5000/delete/6. This simple URL scheme could be used by an attacker
     to trick a user into deleting a post. For example, an attacker could lure a user to the
     RSVP app with a link embedded in an app icon for the RSVP app. This icon could include this
     URL which would cause the user to accidentally delete guests.
     */
    deleteGuest: (req, res) => {
        let guestId = req.params.id;
        let getImageQuery = 'SELECT image from `guests` WHERE id = "' + guestId + '"';
        let deleteUserQuery = 'DELETE FROM guests WHERE id = "' + guestId + '"';

        db.query(getImageQuery, (err, result) => {
            if (err) {
                return res.status(500).send(err);
            }

            let image = result[0].image;

            fs.unlink(`public/assets/img/${image}`, (err) => {
                if (err) {
                    return res.status(500).send(err);
                }
                db.query(deleteUserQuery, (err, result) => {
                    if (err) {
                        return res.status(500).send(err);
                    }
                    res.redirect('/');
                });
            });
        });
    }
};

