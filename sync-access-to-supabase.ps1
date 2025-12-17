# Access to Supabase Sync Script
# Run this manually whenever you want to sync your Access database to Supabase

param(
    [string]$AccessDbPath = "C:\Path\To\Your\Database.accdb",
    [string]$SupabaseUrl = "YOUR_SUPABASE_URL",
    [string]$SupabaseKey = "YOUR_SUPABASE_ANON_KEY",
    [switch]$DryRun = $false
)

# Configuration
$ErrorActionPreference = "Stop"
$logFile = "sync-log-$(Get-Date -Format 'yyyyMMdd-HHmmss').txt"

function Write-Log {
    param($Message)
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logMessage = "[$timestamp] $Message"
    Write-Host $logMessage
    Add-Content -Path $logFile -Value $logMessage
}

function Get-AccessData {
    param(
        [string]$DbPath,
        [string]$TableName
    )
    
    $connection = $null
    try {
        $connectionString = "Provider=Microsoft.ACE.OLEDB.12.0;Data Source=$DbPath;"
        $connection = New-Object System.Data.OleDb.OleDbConnection($connectionString)
        $connection.Open()
        
        # Try with brackets first (for tables)
        $query = "SELECT * FROM [$TableName]"
        Write-Log "Querying: $query"
        
        $command = New-Object System.Data.OleDb.OleDbCommand($query, $connection)
        $adapter = New-Object System.Data.OleDb.OleDbDataAdapter($command)
        $dataTable = New-Object System.Data.DataTable
        
        try {
            [void]$adapter.Fill($dataTable)
        }
        catch {
            # If brackets fail, try without (for queries)
            Write-Log "Retrying without brackets..."
            $query = "SELECT * FROM $TableName"
            $command = New-Object System.Data.OleDb.OleDbCommand($query, $connection)
            $adapter = New-Object System.Data.OleDb.OleDbDataAdapter($command)
            $dataTable = New-Object System.Data.DataTable
            [void]$adapter.Fill($dataTable)
        }
        
        Write-Log "Retrieved $($dataTable.Rows.Count) rows, $($dataTable.Columns.Count) columns from $TableName"
        
        return ,$dataTable
    }
    catch {
        Write-Log "ERROR reading from Access object ${TableName}: $_"
        Write-Log "ERROR details: $($_.Exception.Message)"
        throw
    }
    finally {
        if ($connection -and $connection.State -eq 'Open') {
            $connection.Close()
        }
    }
}

function Sync-ToSupabase {
    param(
        [Parameter(Mandatory=$true, Position=0)]
        [System.Data.DataTable]$Data,
        [Parameter(Mandatory=$true, Position=1)]
        [string]$TableName,
        [Parameter(Mandatory=$true, Position=2)]
        [string]$Url,
        [Parameter(Mandatory=$true, Position=3)]
        [string]$Key
    )
    
    Write-Log "Starting sync function for $TableName"
    Write-Log "Data type: $($Data.GetType().FullName)"
    Write-Log "Row count: $($Data.Rows.Count)"
    
    if ($DryRun) {
        Write-Log "DRY RUN: Would sync $($Data.Rows.Count) rows to $TableName"
        return
    }
    
    $headers = @{
        "apikey" = $Key
        "Authorization" = "Bearer $Key"
        "Content-Type" = "application/json"
        "Prefer" = "resolution=merge-duplicates,return=minimal"
    }
    
    # Add on_conflict parameter for upsert based on table
    $onConflict = switch ($TableName) {
        "athletes" { "fincode" }
        "results_teammanager" { "resultsid" }
        "results_teammanager_staging" { "resultsid" }
        "meets_teammanager" { "meetsid" }
        "rosters" { "rosterid" }
        default { $null }
    }
    
    if ($onConflict) {
        $endpoint = "$Url/rest/v1/$TableName`?on_conflict=$onConflict"
    } else {
        $endpoint = "$Url/rest/v1/$TableName"
    }
    $successCount = 0
    $errorCount = 0
    
    # Convert DataTable to array of objects
    Write-Log "Starting conversion to array..."
    $records = New-Object System.Collections.Generic.List[Object]
    
    # Define columns to exclude per table (columns managed by Supabase)
    $excludeColumns = switch ($TableName) {
        "athletes" { @("athleteid") }
        default { @() }
    }
    
    $rowIndex = 0
    foreach ($row in $Data.Rows) {
        if ($rowIndex -eq 0 -or $rowIndex % 100 -eq 0) {
            Write-Log "Processing row $rowIndex of $($Data.Rows.Count)..."
        }
        
        $record = @{}
        
        foreach ($column in $Data.Columns) {
            $columnName = $column.ColumnName
            
            # Skip excluded columns
            if ($excludeColumns -contains $columnName) {
                continue
            }
            
            try {
                $value = $row[$column]
                
                # Handle NULL/DBNull values
                if ([System.DBNull]::Value.Equals($value) -or $null -eq $value) {
                    $record[$columnName] = $null
                }
                else {
                    # Keep the original type instead of converting to string
                    # This preserves integers, decimals, dates, etc.
                    $record[$columnName] = $value
                }
            }
            catch {
                Write-Log "ERROR processing column '$columnName' in row $rowIndex`: $($_.Exception.Message)"
                # Set to null on error
                $record[$columnName] = $null
            }
        }
        
        $records.Add($record)
        $rowIndex++
    }
    
    Write-Log "Converted $($records.Count) records successfully"
    
    # Send all records at once (or batch if needed)
    if ($records.Count -eq 0) {
        Write-Log "No records to sync"
        return
    }
    
    # Send records one by one to avoid ON CONFLICT issues with bulk updates
    Write-Log "Syncing records individually..."
    $recordIndex = 0
    foreach ($record in $records) {
        try {
            if ($recordIndex % 100 -eq 0) {
                Write-Log "Syncing record $recordIndex of $($records.Count)..."
            }
            
            $json = ConvertTo-Json -InputObject @($record) -Depth 10 -Compress
            $response = Invoke-RestMethod -Uri $endpoint -Method Post -Headers $headers -Body ([System.Text.Encoding]::UTF8.GetBytes($json)) -ContentType "application/json"
            $successCount++
        }
        catch {
            $errorCount++
            if ($errorCount -le 3) {
                # Log first 3 errors only with more details
                Write-Log "ERROR syncing record $recordIndex with $onConflict=$($record[$onConflict]): $($_.Exception.Message)"
                if ($_.ErrorDetails) {
                    Write-Log "ERROR details: $($_.ErrorDetails.Message)"
                }
            }
        }
        $recordIndex++
    }
    
    Write-Log "Sync complete for $TableName - Success: $successCount, Errors: $errorCount"
}

# Main sync process
try {
    Write-Log "=== Starting Access to Supabase Sync ==="
    Write-Log "Access DB: $AccessDbPath"
    Write-Log "Supabase URL: $SupabaseUrl"
    if ($DryRun) {
        Write-Log "MODE: DRY RUN (no changes will be made)"
    }
    
    # Define tables to sync (modify according to your needs)
    $tablesToSync = @(
        # "athletes",
        "results_teammanager_staging"
        # "meets_teammanager",
        # "rosters"
    )
    
    foreach ($table in $tablesToSync) {
        Write-Log "--- Processing table: $table ---"
        
        # Get data from Access
        $data = Get-AccessData -DbPath $AccessDbPath -TableName $table
        
        Write-Log "Data returned type: $($data.GetType().FullName)"
        
        # Sync to Supabase - pass as single argument to preserve type
        $result = Sync-ToSupabase $data $table $SupabaseUrl $SupabaseKey
    }
    
    Write-Log "=== Sync completed successfully ==="
}
catch {
    Write-Log "=== FATAL ERROR: Sync failed ==="
    Write-Log $_.Exception.Message
    Write-Log "Stack trace: $($_.ScriptStackTrace)"
    exit 1
}
