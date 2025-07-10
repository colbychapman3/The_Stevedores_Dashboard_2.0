from . import db
from sqlalchemy import Integer, String, Date, DateTime, Float, Text

class Ship(db.Model):
    id = db.Column(Integer, primary_key=True)
    vesselName = db.Column(String)
    vesselType = db.Column(String)
    shippingLine = db.Column(String)
    port = db.Column(String)
    operationDate = db.Column(Date)
    company = db.Column(String)
    operationType = db.Column(String)
    berth = db.Column(String)
    operationManager = db.Column(String)
    autoOpsLead = db.Column(String)
    autoOpsAssistant = db.Column(String)
    heavyOpsLead = db.Column(String)
    heavyOpsAssistant = db.Column(String)
    totalVehicles = db.Column(Integer)
    totalAutomobilesDischarge = db.Column(Integer)
    heavyEquipmentDischarge = db.Column(Integer)
    totalElectricVehicles = db.Column(Integer)
    totalStaticCargo = db.Column(Integer)
    brvTarget = db.Column(Integer)
    zeeTarget = db.Column(Integer)
    souTarget = db.Column(Integer)
    expectedRate = db.Column(Integer)
    totalDrivers = db.Column(Integer)
    shiftStart = db.Column(String)
    shiftEnd = db.Column(String)
    breakDuration = db.Column(Integer)
    targetCompletion = db.Column(String)
    ticoVans = db.Column(Integer)
    ticoStationWagons = db.Column(Integer)
    status = db.Column(String)
    progress = db.Column(Integer)
    createdAt = db.Column(DateTime, default=db.func.current_timestamp())
    startTime = db.Column(String)
    estimatedCompletion = db.Column(String)
    updatedAt = db.Column(DateTime, default=db.func.current_timestamp(), onupdate=db.func.current_timestamp())
    
    # JSON fields for widget data
    deck_data = db.Column(Text)
    turnaround_data = db.Column(Text)
    inventory_data = db.Column(Text)
    hourly_quantity_data = db.Column(Text)

    def __repr__(self):
        return f'<Ship {self.vesselName}>'
