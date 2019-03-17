package controllers

import (
	"encoding/json"
	"net/http"

	"../common"
	"../models"
	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
	"gopkg.in/mgo.v2"
	"gopkg.in/mgo.v2/bson"
)

// Get mentor by id
func getMentorByID(c *gin.Context, id string) (error, *models.Mentor) {
	database := c.MustGet("db").(*mgo.Database)
	oID := bson.ObjectIdHex(id)
	mentor := models.Mentor{}
	err := database.C(models.CollectionMentor).FindId(oID).One(&mentor)
	if err != nil {
		return err, nil
	}

	return nil, &mentor
}

// List all mentors
func ListMentors(c *gin.Context) {
	database := c.MustGet("db").(*mgo.Database)

	//mentors := []models.Mentor{}
	collection := database.C(models.CollectionMentor)
	query := []bson.M{
		{
			"$lookup": bson.M{ // lookup the documents table here
				"from":         "supervisor",
				"localField":   "SupervisorID",
				"foreignField": "_id",
				"as":           "Supervisor",
			}},
		{
			"$unwind": "$Supervisor",
		},
		{"$match": bson.M{
			"IsDeleted": false,
		}},
		{
			"$project": bson.M{
				"Name":           1,
				"PhoneNumber":    1,
				"Gender":         1,
				"Email":          1,
				"DayofBirth":     1,
				"Department":     1,
				"SupervisorID":   1,
				"IsDeleted":      1,
				"SupervisorName": "$Supervisor.Name",
			},
		},
	}
	pipe := collection.Pipe(query)
	resp := []bson.M{}
	err := pipe.All(&resp)
	//err := database.C(models.CollectionMentor).Find(bson.M{"IsDeleted": false}).All(&mentors)
	if common.CheckError(c, err) {
		return
	}

	c.JSON(http.StatusOK, resp)
}

// Get an mentor
func GetMentor(c *gin.Context) {
	err, mentor := getMentorByID(c, c.Param("id"))
	if common.CheckNotFound(c, err) {
		return
	}
	c.JSON(http.StatusOK, mentor)
}

// Create an mentor
func CreateMentor(c *gin.Context) {
	database := c.MustGet("db").(*mgo.Database)

	mentor := models.Mentor{}
	buf, _ := c.GetRawData()
	err := json.Unmarshal(buf, &mentor)
	if common.CheckError(c, err) {
		return
	}

	err = database.C(models.CollectionMentor).Insert(mentor)
	if common.CheckError(c, err) {
		return
	}

	err = database.C(models.CollectionMentor).Find(nil).Sort("-$natural").Limit(1).One(&mentor)
	if common.CheckError(c, err) {
		return
	}

	// Create User
	hash, _ := bcrypt.GenerateFromPassword([]byte(common.DefaultPassword), bcrypt.DefaultCost)
	user := models.User{}
	user.UserName = mentor.Email
	user.Password = string(hash)
	user.Role = 2
	user.RoleID = mentor.ID

	err = database.C(models.CollectionUser).Insert(user)
	if common.CheckError(c, err) {
		return
	}
	c.JSON(http.StatusCreated, mentor)
}

// Update an mentor
func UpdateMentor(c *gin.Context) {
	database := c.MustGet("db").(*mgo.Database)

	mentor := models.Mentor{}
	buf, _ := c.GetRawData()
	err := json.Unmarshal(buf, &mentor)
	if common.CheckError(c, err) {
		return
	}

	err = database.C(models.CollectionMentor).UpdateId(mentor.ID, mentor)
	if common.CheckError(c, err) {
		return
	}

	c.JSON(http.StatusOK, nil)
}

// Delete an mentor
func DeleteMentor(c *gin.Context) {
	database := c.MustGet("db").(*mgo.Database)

	err := database.C(models.CollectionMentor).UpdateId(bson.ObjectIdHex(c.Param("id")), bson.M{"$set": bson.M{"IsDeleted": true}})
	if common.CheckError(c, err) {
		return
	}

	//Delete User
	if !DeleteUser(c, bson.ObjectIdHex(c.Param("id"))) {
		return
	}
	c.JSON(http.StatusNoContent, nil)
}
